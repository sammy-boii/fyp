import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  ExecutionContext,
  NodeExecutionResult
} from '../types/workflow.types'
import { NodeExecutorRegistry } from './registry'

export class WorkflowExecutor {
  private nodeExecutors: NodeExecutorRegistry

  constructor(nodeExecutors: NodeExecutorRegistry) {
    this.nodeExecutors = nodeExecutors
  }

  /**
   * Builds a dependency graph from workflow nodes and edges
   */
  private buildDependencyGraph(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>()
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    // Initialize all nodes
    for (const node of nodes) {
      graph.set(node.id, [])
    }

    // Build dependencies (target depends on source)
    for (const edge of edges) {
      const dependencies = graph.get(edge.target) || []
      dependencies.push(edge.source)
      graph.set(edge.target, dependencies)
    }

    return graph
  }

  /**
   * Topological sort to determine execution order
   */
  private topologicalSort(
    graph: Map<string, string[]>
  ): string[][] {
    const levels: string[][] = []
    const inDegree = new Map<string, number>()
    const queue: string[] = []

    // Calculate in-degree for each node
    for (const [nodeId, deps] of graph.entries()) {
      inDegree.set(nodeId, deps.length)
      if (deps.length === 0) {
        queue.push(nodeId)
      }
    }

    // Process nodes level by level
    while (queue.length > 0) {
      const level: string[] = []
      const currentLevelSize = queue.length

      for (let i = 0; i < currentLevelSize; i++) {
        const nodeId = queue.shift()!
        level.push(nodeId)

        // Reduce in-degree for dependent nodes
        for (const [targetId, deps] of graph.entries()) {
          if (deps.includes(nodeId)) {
            const newInDegree = (inDegree.get(targetId) || 0) - 1
            inDegree.set(targetId, newInDegree)
            if (newInDegree === 0) {
              queue.push(targetId)
            }
          }
        }
      }

      levels.push(level)
    }

    return levels
  }

  /**
   * Collects input data from all source nodes for a target node
   */
  private collectInputData(
    nodeId: string,
    edges: WorkflowEdge[],
    nodeData: Map<string, any>
  ): any {
    const incomingEdges = edges.filter((e) => e.target === nodeId)

    if (incomingEdges.length === 0) {
      return null
    }

    if (incomingEdges.length === 1) {
      // Single input - pass data directly
      const sourceId = incomingEdges[0].source
      return nodeData.get(sourceId) || null
    }

    // Multiple inputs - combine into array
    return incomingEdges.map((edge) => ({
      source: edge.source,
      data: nodeData.get(edge.source) || null
    }))
  }

  /**
   * Executes a workflow
   */
  async execute(
    workflow: WorkflowDefinition,
    context: ExecutionContext
  ): Promise<Map<string, NodeExecutionResult>> {
    const { nodes, edges } = workflow
    const results = new Map<string, NodeExecutionResult>()
    const nodeData = new Map<string, any>()

    // Build dependency graph
    const graph = this.buildDependencyGraph(nodes, edges)

    // Get execution order (topological sort)
    const executionLevels = this.topologicalSort(graph)

    // Execute nodes level by level
    for (const level of executionLevels) {
      // Execute nodes in parallel within the same level
      const levelPromises = level.map(async (nodeId) => {
        const node = nodes.find((n) => n.id === nodeId)
        if (!node) {
          return {
            nodeId,
            result: {
              success: false,
              error: `Node ${nodeId} not found`
            } as NodeExecutionResult
          }
        }

        // Collect input data from previous nodes
        const inputData = this.collectInputData(nodeId, edges, nodeData)
        context.nodeData = nodeData

        // Get executor for this node type
        const executor = this.nodeExecutors.get(node.data.type)
        if (!executor) {
          return {
            nodeId,
            result: {
              success: false,
              error: `No executor found for node type: ${node.data.type}`
            } as NodeExecutionResult
          }
        }

        try {
          // Execute the node
          const result = await executor.execute(node, context)

          // Store output data if successful
          if (result.success && result.data !== undefined) {
            nodeData.set(nodeId, result.data)
          }

          return { nodeId, result }
        } catch (error) {
          return {
            nodeId,
            result: {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred'
            } as NodeExecutionResult
          }
        }
      })

      // Wait for all nodes in this level to complete
      const levelResults = await Promise.all(levelPromises)

      // Store results
      for (const { nodeId, result } of levelResults) {
        results.set(nodeId, result)

        // If a node failed, we might want to stop execution
        // For now, we continue (you can add error handling strategy)
        if (!result.success) {
          console.error(`Node ${nodeId} failed:`, result.error)
        }
      }
    }

    return results
  }
}

