// Workflow execution types
export type WorkflowNode = {
  id: string
  type: string
  data: {
    type: string
    actionId?: string
    config?: Record<string, any>
    [key: string]: any
  }
  position: { x: number; y: number }
}

export type WorkflowEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export type WorkflowDefinition = {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export type ExecutionContext = {
  executionId: string
  workflowId: number
  userId: string
  nodeData: Map<string, any> // nodeId -> output data
}

export type NodeExecutionResult = {
  success: boolean
  data?: any
  error?: string
}

export interface NodeExecutor {
  execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult>
}

