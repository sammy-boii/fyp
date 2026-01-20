import { NODE_ACTION_ID } from './../../../../shared/src/constants'
import { Context } from 'hono'
import { AppError } from '@/src/types'
import { prisma } from '@shared/db/prisma'
import { TWorkflowNode, TNodeExecutionResult } from '@/src/types/workflow.types'
import {
  executeReadEmail,
  executeSendEmail
} from '@/src/executors/gmail-executor'
import { NodeExecutionStatus } from '@shared/prisma/generated/prisma/enums'

const executeNodeLogic = async (
  node: TWorkflowNode,
  config: any,
  inputData: any = null
): Promise<TNodeExecutionResult> => {
  const { actionId } = node.data

  console.log(`[executeNode] Node ${node.id} | Action: ${actionId}`)

  let result: TNodeExecutionResult

  switch (actionId) {
    case NODE_ACTION_ID.SEND_EMAIL:
      result = await executeSendEmail(config, inputData)
      break

    case NODE_ACTION_ID.READ_EMAIL:
      result = await executeReadEmail(config, inputData)
      break

    default:
      result = { success: false, error: `Unknown action: ${actionId}` }
  }

  return result
}

export const executeNode = async (c: Context) => {
  try {
    const { workflowId, nodeId } = c.req.param()
    const user = c.get('user')

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 401)
    }

    if (!workflowId || !nodeId) {
      return c.json(
        { success: false, error: 'Workflow ID and Node ID are required' },
        400
      )
    }

    // Fetch workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    })

    if (!workflow) {
      return c.json({ success: false, error: 'Workflow not found' }, 404)
    }

    // Verify ownership
    if (workflow.authorId !== user.id) {
      return c.json(
        { success: false, error: 'Unauthorized to execute this workflow' },
        403
      )
    }

    // Parse nodes and find the specific node
    const nodes = workflow.nodes as TWorkflowNode[]
    const node = nodes.find((n) => n.id === nodeId)

    if (!node) {
      return c.json({ success: false, error: 'Node not found' }, 404)
    }

    // Check if node has configuration
    if (!node.data.actionId || !node.data.config) {
      return c.json({ success: false, error: 'Node is not configured' }, 400)
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
