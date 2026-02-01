import { prisma } from '@shared/db/prisma'
import {
  TWorkflowNode,
  TWorkflowEdge,
  TNodeExecutionResult
} from '@/src/types/workflow.types'
import {
  NodeExecutionStatus,
  TriggerType,
  WorkflowExecutionStatus
} from '@shared/prisma/generated/prisma/enums'
import { executeNodeLogic } from '@/src/executors/node-executor'
import { replacePlaceholdersInConfig } from '@/src/lib/placeholder'
import { AppError } from '@/src/types'

/**
 * Execute a workflow programmatically (not from HTTP request).
 * Used by trigger handlers like Discord bot.
 */
export async function executeWorkflowById(
  workflowId: string,
  triggerData?: Record<string, any>
): Promise<{ success: boolean; executionId?: string; error?: string }> {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    })

    if (!workflow) {
      return { success: false, error: 'Workflow not found' }
    }

    const nodes = workflow.nodes as TWorkflowNode[]
    const edges = workflow.edges as TWorkflowEdge[]

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: WorkflowExecutionStatus.RUNNING,
        triggerType: TriggerType.WEBHOOK
      }
    })

    const startTime = Date.now()

    // Store outputs from executed nodes for placeholder replacement
    const nodeOutputs = new Map<string, Record<string, any>>()

    // If trigger data is provided, seed it as the first output
    if (triggerData) {
      // Find the trigger node and set its output
      const triggerNode = nodes.find((node) =>
        node.data?.actionId?.includes('webhook')
      )
      if (triggerNode) {
        nodeOutputs.set(triggerNode.id, triggerData)
      }
    }

    try {
      // Build execution order
      const executionOrder = buildExecutionOrder(nodes, edges)

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        const node = nodes.find((n) => n.id === nodeId)
        if (!node) continue

        // Skip trigger node if we already have trigger data
        if (triggerData && node.data?.actionId?.includes('webhook')) {
          continue
        }

        const result = await executeNode(node, execution.id, nodeOutputs)

        if (!result.success) {
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
          return {
            success: false,
            executionId: execution.id,
            error: result.error
          }
        }

        // Store the output for use by subsequent nodes
        if (result.data) {
          nodeOutputs.set(nodeId, result.data)
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

      return { success: true, executionId: execution.id }
    } catch (error: any) {
      const duration = Date.now() - startTime
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: WorkflowExecutionStatus.FAILED,
          error: error.message,
          duration,
          completedAt: new Date()
        }
      })
      return {
        success: false,
        executionId: execution.id,
        error: error.message
      }
    }
  } catch (error: any) {
    console.error(`Failed to execute workflow ${workflowId}:`, error)
    return { success: false, error: error.message }
  }
}

const executeNode = async (
  node: TWorkflowNode,
  executionId: string,
  nodeOutputs: Map<string, Record<string, any>>
): Promise<TNodeExecutionResult> => {
  const { actionId, config } = node.data

  if (!actionId || actionId === 'unknown') {
    throw new AppError('Node action not configured', 400)
  }

  // Replace placeholders in config with actual values from previous node outputs
  const resolvedConfig = config
    ? replacePlaceholdersInConfig(config, nodeOutputs)
    : config

  const nodeExecution = await prisma.nodeExecution.create({
    data: {
      executionId,
      nodeId: node.id,
      nodeType: node.type,
      actionId: actionId,
      config: resolvedConfig || {},
      status: NodeExecutionStatus.RUNNING,
      startedAt: new Date()
    }
  })

  const result: TNodeExecutionResult = await executeNodeLogic(
    node,
    resolvedConfig
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
