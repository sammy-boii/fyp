import { NODE_ACTION_ID } from '@shared/constants'
import { Context } from 'hono'
import { AppError } from '@/src/types'
import { tryCatch } from '@/src/lib/utils'
import { prisma } from '@shared/db/prisma'
import {
  TWorkflowNode,
  TWorkflowEdge,
  TNodeExecutionResult
} from '@/src/types/workflow.types'
import {
  executeReadEmail,
  executeSendEmail
} from '@/src/executors/gmail-executor'
import {
  NodeExecutionStatus,
  TriggerType,
  WorkflowExecutionStatus
} from '@shared/prisma/generated/prisma/enums'
import { executeNodeLogic } from '@/src/executors/node-executor'

const executeNode = async (
  node: TWorkflowNode,
  inputData: any,
  executionId: string
): Promise<TNodeExecutionResult> => {
  const { actionId, config } = node.data

  const nodeExecution = await prisma.nodeExecution.create({
    data: {
      executionId,
      nodeId: node.id,
      nodeType: node.type,
      actionId: actionId,
      config: config || {},
      inputData: inputData || null,
      status: NodeExecutionStatus.RUNNING,
      startedAt: new Date()
    }
  })

  const result: TNodeExecutionResult = await executeNodeLogic(
    node,
    config,
    inputData
  )

  await prisma.nodeExecution.update({
    where: { id: nodeExecution.id },
    data: {
      status: result.success
        ? NodeExecutionStatus.COMPLETED
        : NodeExecutionStatus.FAILED,
      outputData: result.data || null,
      error: result.error || null,
      completedAt: new Date()
    }
  })

  return result
}

const buildExecutionOrder = (
  nodes: TWorkflowNode[],
  edges: TWorkflowEdge[]
): string[] => {
  const adjacencyList = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  // Initialize all nodes
  nodes.forEach((node) => {
    adjacencyList.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  // Build graph from edges
  edges.forEach((edge) => {
    adjacencyList.get(edge.source)?.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  })

  // Start with nodes that have no incoming edges (dependencies)
  const queue: string[] = []
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId)
    }
  })

  const executionOrder: string[] = []

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    executionOrder.push(nodeId)

    adjacencyList.get(nodeId)?.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) {
        queue.push(neighbor)
      }
    })
  }

  // Check for cycles
  if (executionOrder.length !== nodes.length) {
    throw new AppError('Workflow contains cycles and cannot be executed', 400)
  }

  return executionOrder
}

export const runWorkflow = tryCatch(async (c: Context) => {
  const workflowId = c.req.param('id')
  const user = c.get('user')

  if (!user) {
    throw new AppError('User not found', 401)
  }

  if (!workflowId) {
    throw new AppError('Workflow ID is required', 400)
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
  const edges = workflow.edges as TWorkflowEdge[]

  console.log(`\n=== Executing Workflow: ${workflow.name} (${workflow.id}) ===`)
  console.log(`Total nodes: ${nodes.length}, Total edges: ${edges.length}\n`)

  // Create workflow execution record
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      status: WorkflowExecutionStatus.RUNNING,
      triggerType: TriggerType.MANUAL
    }
  })

  const startTime = Date.now()

  try {
    // Build execution order
    const executionOrder = buildExecutionOrder(nodes, edges)
    console.log('Execution order:', executionOrder)

    // Execute nodes in order without passing previous outputs
    for (const nodeId of executionOrder) {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) continue

      // Execute node without inherited inputs
      const result = await executeNode(node, null, execution.id)

      if (!result.success) {
        // Stop on failure
        console.error(`Node ${nodeId} failed:`, result.error)
        const duration = Date.now() - startTime

        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: WorkflowExecutionStatus.FAILED,
            error: `Node ${nodeId} failed: ${result.error}`,
            duration,
            completedAt: new Date()
          }
        })

        throw new AppError(
          `Workflow execution failed at node ${nodeId}: ${result.error}`,
          500
        )
      }
    }

    const duration = Date.now() - startTime

    // Mark as completed
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: WorkflowExecutionStatus.COMPLETED,
        duration,
        completedAt: new Date()
      }
    })

    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { lastExecutedAt: new Date() }
    })

    console.log(`\n=== Workflow Execution Complete (${duration}ms) ===\n`)

    return {
      ...execution,
      duration
    }
  } catch (error: any) {
    // If not already handled, mark as failed
    const duration = Date.now() - startTime

    const currentExecution = await prisma.workflowExecution.findUnique({
      where: { id: execution.id }
    })

    if (currentExecution?.status === 'RUNNING') {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          error: error.message,
          duration,
          completedAt: new Date()
        }
      })
    }

    console.error(`\n=== Workflow Execution Failed ===`)
    console.error(error)

    throw new AppError(
      `Workflow execution failed: ${error.message}`,
      500,
      error
    )
  }
})
