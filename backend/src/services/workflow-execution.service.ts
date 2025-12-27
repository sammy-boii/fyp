import { prisma } from '@shared/db/prisma'
import { WorkflowExecutor } from '../executors/base.executor'
import { NodeExecutorRegistry } from '../executors/registry'
import { GmailExecutor } from '../executors/nodes/gmail.executor'
import { GoogleDriveExecutor } from '../executors/nodes/google-drive.executor'
import type {
  WorkflowDefinition,
  ExecutionContext
} from '../types/workflow.types'

export class WorkflowExecutionService {
  private executor: WorkflowExecutor

  constructor() {
    // Initialize executor registry
    const registry = new NodeExecutorRegistry()
    registry.register('GMAIL', new GmailExecutor())
    registry.register('GOOGLE_DRIVE', new GoogleDriveExecutor())

    this.executor = new WorkflowExecutor(registry)
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: number,
    userId: string,
    triggerData?: any
  ) {
    // Load workflow from database
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { author: true }
    })

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    if (workflow.authorId !== userId) {
      throw new Error('Unauthorized: Workflow does not belong to user')
    }

    // Parse workflow definition
    const definition: WorkflowDefinition = {
      nodes: workflow.nodes as any,
      edges: workflow.edges as any
    }

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        status: 'running'
      }
    })

    try {
      // Create execution context
      const context: ExecutionContext = {
        executionId: execution.id,
        workflowId,
        userId,
        nodeData: new Map()
      }

      // If trigger data provided, add it to context
      if (triggerData) {
        // Find trigger nodes (nodes with no incoming edges)
        const triggerNodes = definition.nodes.filter(
          (node) =>
            !definition.edges.some((edge) => edge.target === node.id)
        )
        for (const node of triggerNodes) {
          context.nodeData.set(node.id, triggerData)
        }
      }

      // Execute workflow
      const results = await this.executor.execute(definition, context)

      // Save node execution results
      for (const [nodeId, result] of results.entries()) {
        const node = definition.nodes.find((n) => n.id === nodeId)
        if (!node) continue

        await prisma.nodeExecution.create({
          data: {
            executionId: execution.id,
            nodeId,
            nodeType: node.data.type,
            actionId: node.data.actionId || '',
            config: node.data.config || {},
            inputData: context.nodeData.get(nodeId) || null,
            outputData: result.data || null,
            error: result.error || null,
            status: result.success ? 'completed' : 'failed'
          }
        })
      }

      // Check if execution was successful
      const allSuccessful = Array.from(results.values()).every(
        (r) => r.success
      )

      // Update execution status
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: allSuccessful ? 'completed' : 'failed',
          completedAt: new Date()
        }
      })

      // Update workflow last executed time
      await prisma.workflow.update({
        where: { id: workflowId },
        data: {
          updatedAt: new Date()
        }
      })

      return {
        executionId: execution.id,
        status: allSuccessful ? 'completed' : 'failed',
        results: Object.fromEntries(results)
      }
    } catch (error) {
      // Mark execution as failed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        }
      })

      throw error
    }
  }

  /**
   * Get execution history for a workflow
   */
  async getExecutionHistory(workflowId: number, userId: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    })

    if (!workflow || workflow.authorId !== userId) {
      throw new Error('Workflow not found or unauthorized')
    }

    return await prisma.workflowExecution.findMany({
      where: { workflowId },
      include: {
        nodeExecutions: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 executions
    })
  }

  /**
   * Get a specific execution with details
   */
  async getExecution(executionId: string, userId: string) {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        workflow: true,
        nodeExecutions: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!execution || execution.workflow.authorId !== userId) {
      throw new Error('Execution not found or unauthorized')
    }

    return execution
  }
}

