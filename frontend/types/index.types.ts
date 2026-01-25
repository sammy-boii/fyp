export type ValueOf<T> = T[keyof T]

// Node execution result from the API
export type NodeExecutionResult = {
  success: boolean
  message: string
  node: {
    id: string
    type: string
    actionId: string
    duration: number
  }
  output?: Record<string, any>
  error?: string
}
