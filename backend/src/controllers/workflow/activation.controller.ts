import { Context } from 'hono'
import { AppError } from '@/src/types'
import { tryCatch } from '@/src/lib/utils'
import { prisma } from '@shared/db/prisma'
import { triggerCache } from '@/src/lib/trigger-cache'

/**
 * Toggle workflow active status.
 * Updates the database and refreshes the trigger cache.
 */
export const toggleWorkflowActive = tryCatch(async (c: Context) => {
  const workflowId = c.req.param('id')
  const user = c.get('user')

  if (!user) {
    throw new AppError('User not found', 401)
  }

  if (!workflowId) {
    throw new AppError('Workflow ID is required', 400)
  }

  const body = await c.req.json<{ isActive: boolean }>()
  const { isActive } = body

  if (typeof isActive !== 'boolean') {
    throw new AppError('isActive must be a boolean', 400)
  }

  // Verify workflow exists and belongs to user
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  })

  if (!workflow) {
    throw new AppError('Workflow not found', 404)
  }

  if (workflow.authorId !== user.id) {
    throw new AppError('Unauthorized to modify this workflow', 403)
  }

  // Update the workflow
  const updatedWorkflow = await prisma.workflow.update({
    where: { id: workflowId },
    data: { isActive }
  })

  // Update trigger cache
  if (isActive) {
    await triggerCache.refreshWorkflow(workflowId)
    console.log(`✅ Workflow ${workflowId} activated`)
  } else {
    triggerCache.removeWorkflow(workflowId)
    console.log(`⏸️ Workflow ${workflowId} deactivated`)
  }

  return c.json({
    success: true,
    data: {
      id: updatedWorkflow.id,
      isActive: updatedWorkflow.isActive
    }
  })
})
