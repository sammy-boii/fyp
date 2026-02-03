import { Context } from 'hono'
import { AppError } from '@/src/types'
import { tryCatch } from '@/src/lib/utils'
import { prisma } from '@shared/db/prisma'
import { triggerCache } from '@/src/lib/trigger-cache'
import { workflowScheduler } from '@/src/lib/workflow-scheduler'

/**
 * Toggle workflow active status.
 * Updates the database and refreshes the trigger cache.
 */
export const updateWorkflowCache = tryCatch(async (c: Context) => {
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
    await workflowScheduler.refreshWorkflow(workflowId)
    console.log(`✅ Workflow ${workflowId} activated`)
  } else {
    triggerCache.removeWorkflow(workflowId)
    workflowScheduler.removeWorkflow(workflowId)
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

/**
 * Refresh the trigger cache for a workflow.
 * Called when any workflow is saved/updated to ensure cache consistency.
 * Handles all cases:
 * - Workflow changed from Discord trigger to Manual trigger (removes from cache)
 * - Workflow changed from Manual to Discord trigger (adds to cache)
 * - Discord trigger config changed (updates cache)
 * - Workflow activated/deactivated (adds/removes from cache)
 */
export const refreshWorkflowCache = tryCatch(async (c: Context) => {
  const workflowId = c.req.param('id')
  const user = c.get('user')

  if (!user) {
    throw new AppError('User not found', 401)
  }

  if (!workflowId) {
    throw new AppError('Workflow ID is required', 400)
  }

  // Verify workflow exists and belongs to user
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  })

  if (!workflow) {
    throw new AppError('Workflow not found', 404)
  }

  if (workflow.authorId !== user.id) {
    throw new AppError('Unauthorized to access this workflow', 403)
  }

  // Check if workflow was in cache before refresh
  const wasInCache = triggerCache.hasWorkflow(workflowId)

  // Refresh the cache - this handles all cases:
  // - Removes existing entry first
  // - Re-adds only if workflow is active AND has a properly configured Discord trigger
  await triggerCache.refreshWorkflow(workflowId)
  await workflowScheduler.refreshWorkflow(workflowId)

  // Check if workflow is in cache after refresh
  const isInCache = triggerCache.hasWorkflow(workflowId)

  // Log what happened for debugging
  if (wasInCache && !isInCache) {
    console.log(
      `🗑️ Workflow ${workflowId} removed from trigger cache (no longer has active Discord trigger)`
    )
  } else if (!wasInCache && isInCache) {
    console.log(`➕ Workflow ${workflowId} added to trigger cache`)
  } else if (wasInCache && isInCache) {
    console.log(`🔄 Workflow ${workflowId} trigger cache updated`)
  }

  return c.json({
    success: true,
    data: {
      workflowId,
      inCache: isInCache
    }
  })
})

/**
 * Remove a workflow from the trigger cache.
 * Called before a workflow is deleted to ensure cache cleanup.
 */
export const removeWorkflowCache = tryCatch(async (c: Context) => {
  const workflowId = c.req.param('id')
  const user = c.get('user')

  if (!user) {
    throw new AppError('User not found', 401)
  }

  if (!workflowId) {
    throw new AppError('Workflow ID is required', 400)
  }

  // Verify workflow exists and belongs to user
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  })

  if (!workflow) {
    throw new AppError('Workflow not found', 404)
  }

  if (workflow.authorId !== user.id) {
    throw new AppError('Unauthorized to access this workflow', 403)
  }

  // Check if workflow was in cache
  const wasInCache = triggerCache.hasWorkflow(workflowId)

  // Remove from cache
  triggerCache.removeWorkflow(workflowId)
  workflowScheduler.removeWorkflow(workflowId)

  if (wasInCache) {
    console.log(
      `🗑️ Workflow ${workflowId} removed from trigger cache (workflow deleted)`
    )
  }

  return c.json({
    success: true,
    data: {
      workflowId,
      removed: wasInCache
    }
  })
})
