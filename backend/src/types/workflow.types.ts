export type TWorkflowNode = {
  id: string
  type: string
  data: {
    actionId: string
    config?: Record<string, any>
    [key: string]: any
  }
  [key: string]: any
}

export type TWorkflowEdge = {
  id: string
  source: string
  target: string
  [key: string]: any
}

export type TNodeExecutionResult = {
  success: boolean
  data?: any
  error?: string
}
