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
import { NODE_ACTION_ID } from '@shared/constants'
import {
  emitWorkflowStart,
  emitNodeStart,
  emitNodeComplete,
  emitNodeError,
  emitWorkflowComplete,
  emitWorkflowError
} from '@/src/lib/websocket'

/**
 * Execute a workflow programmatically (not from HTTP request).
 * Used by trigger handlers like Discord bot.
 */
export async function executeWorkflowById(
  workflowId: string,
  triggerData?: Record<string, any>,
  triggerType: TriggerType = TriggerType.WEBHOOK
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
        triggerType
      }
    })

    const startTime = Date.now()

    // Store outputs from executed nodes for placeholder replacement
    const nodeOutputs = new Map<string, Record<string, any>>()

    // If trigger data is provided, seed it as the first output and create execution record
    if (triggerData) {
      // Find the trigger node and set its output
      const triggerNode = nodes.find((node) =>
        node.data?.actionId?.includes('webhook')
      )
      if (triggerNode) {
        nodeOutputs.set(triggerNode.id, triggerData)

        // Create NodeExecution record for the trigger node
        await prisma.nodeExecution.create({
          data: {
            executionId: execution.id,
            nodeId: triggerNode.id,
            nodeType: triggerNode.type,
            actionId: triggerNode.data.actionId || 'discord_webhook',
            config: triggerNode.data.config || {},
            status: NodeExecutionStatus.COMPLETED,
            outputData: triggerData,
            startedAt: new Date(),
            completedAt: new Date()
          }
        })

        // Emit websocket event for trigger node
        emitNodeComplete(
          workflowId,
          execution.id,
          triggerNode.id,
          triggerData,
          { current: 1, total: nodes.length }
        )
      }
    }

    // Emit workflow start event
    emitWorkflowStart(workflowId, execution.id, nodes.length)

    try {
      // Build execution order
      const executionOrder = buildExecutionOrder(nodes, edges)
      console.log('[Workflow] Execution order:', executionOrder)

      // Track nodes to skip (nodes in non-taken branches)
      const skippedNodes = new Set<string>()

      // Execute nodes in order
      let nodeIndex = triggerData ? 1 : 0 // Start from 1 if trigger already counted
      for (const nodeId of executionOrder) {
        // Skip nodes in non-taken branches
        if (skippedNodes.has(nodeId)) {
          continue
        }

        const node = nodes.find((n) => n.id === nodeId)
        if (!node) continue

        // Skip trigger node if we already have trigger data
        if (triggerData && node.data?.actionId?.includes('webhook')) {
          continue
        }

        nodeIndex++
        const progress = { current: nodeIndex, total: nodes.length }

        // Emit node start event
        emitNodeStart(
          workflowId,
          execution.id,
          nodeId,
          node.data?.type || 'Unknown',
          node.data?.actionId || 'unknown',
          progress
        )

        const result = await executeNode(node, execution.id, nodeOutputs)

        if (!result.success) {
          const duration = Date.now() - startTime

          // Emit node error event
          emitNodeError(
            workflowId,
            execution.id,
            nodeId,
            result.error || 'Unknown error',
            progress
          )

          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: WorkflowExecutionStatus.FAILED,
              error: `Node ${nodeId} failed: ${result.error}`,
              duration,
              completedAt: new Date()
            }
          })

          // Emit workflow error event
          emitWorkflowError(
            workflowId,
            execution.id,
            result.error || 'Unknown error',
            duration
          )

          return {
            success: false,
            executionId: execution.id,
            error: result.error
          }
        }

        // Emit node complete event
        emitNodeComplete(
          workflowId,
          execution.id,
          nodeId,
          result.data,
          progress
        )

        // Store the output for use by subsequent nodes
        if (result.data) {
          nodeOutputs.set(nodeId, result.data)
        }

        // Handle conditional branching - must happen after storing output
        const isConditionNode =
          node.data?.actionId === NODE_ACTION_ID.CONDITION.EVALUATE_CONDITION
        console.log('[Node Executed]', {
          nodeId,
          actionId: node.data?.actionId,
          isConditionNode,
          resultData: result.data,
          hasBranchTaken: !!result.data?.branchTaken
        })

        if (isConditionNode && result.data?.branchTaken) {
          const branchTaken = result.data.branchTaken // 'true' or 'false'

          // Find edges from this condition node
          const conditionEdges = edges.filter((e) => e.source === nodeId)

          // Mark nodes in the non-taken branch as skipped
          for (const edge of conditionEdges) {
            // Skip edges that match the taken branch
            if (edge.sourceHandle === branchTaken) {
              continue
            }

            // Also handle case where sourceHandle might be undefined for legacy edges
            if (!edge.sourceHandle) {
              continue
            }

            // Mark the target and all its descendants as skipped
            markDescendantsAsSkipped(edge.target, edges, skippedNodes)
          }
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

      // Emit workflow complete event
      emitWorkflowComplete(workflowId, execution.id, duration)

      return { success: true, executionId: execution.id }
    } catch (error: any) {
      const duration = Date.now() - startTime

      // Emit workflow error event so frontend knows execution failed
      emitWorkflowError(workflowId, execution.id, error.message, duration)

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
    resolvedConfig,
    undefined,
    nodeOutputs
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

/**
 * Recursively mark all descendants of a node as skipped
 */
const markDescendantsAsSkipped = (
  nodeId: string,
  edges: TWorkflowEdge[],
  skippedNodes: Set<string>
): void => {
  if (skippedNodes.has(nodeId)) return
  skippedNodes.add(nodeId)

  // Find all outgoing edges from this node
  const outgoingEdges = edges.filter((e) => e.source === nodeId)
  for (const edge of outgoingEdges) {
    markDescendantsAsSkipped(edge.target, edges, skippedNodes)
  }
}
