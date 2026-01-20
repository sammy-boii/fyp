import { Context } from 'hono'
import { prisma } from '@shared/db/prisma'
import { TWorkflowNode } from '@/src/types/workflow.types'

import { AppError } from '@/src/types'
import { executeNodeLogic } from '@/src/executors/node-executor'

export const executeSingleNode = async (c: Context) => {
  try {
    const { workflowId, nodeId } = c.req.param()
    const user = c.get('user')

    if (!user) {
      throw new AppError('User not found', 501)
    }

    if (!workflowId || !nodeId) {
      throw new AppError('Workflow and Node ID are required', 400)
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    })

    if (!workflow) {
      throw new AppError('Workflow not found', 404)
    }

    if (workflow.authorId !== user.id) {
      throw new AppError('Unauthorized to execute this workflow', 403)
    }

    const nodes = workflow.nodes as TWorkflowNode[]
    const node = nodes.find((n) => n.id === nodeId)

    if (!node) {
      throw new AppError('Node with that ID not found in the workflow', 404)
    }

    if (!node.data.actionId || !node.data.config) {
      throw new AppError('Node not configured', 400)
    }

    console.log(`\n=== Executing Node: ${node.id} ===`)

    const startTime = Date.now()

    // Execute the node
    const result = await executeNodeLogic(node, node.data.config)

    const duration = Date.now() - startTime

    console.log(`\n=== Node Execution Complete (${duration}ms) ===\n`)

    return c.json({
      success: result.success,
      message: result.success
        ? 'Node executed successfully'
        : 'Node execution failed',
      node: {
        id: node.id,
        type: node.type,
        actionId: node.data.actionId,
        duration
      },
      output: result.data,
      error: result.error
    })
  } catch (error: any) {
    console.error('Error executing node:', error)
    return c.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred'
      },
      error.statusCode || 500
    )
  }
}
