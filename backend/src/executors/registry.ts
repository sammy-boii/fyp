import type { NodeExecutor } from '../types/workflow.types'

/**
 * Registry for node executors
 * Maps node types (e.g., 'GMAIL', 'GOOGLE_DRIVE') to their executors
 */
export class NodeExecutorRegistry {
  private executors = new Map<string, NodeExecutor>()

  register(nodeType: string, executor: NodeExecutor) {
    this.executors.set(nodeType, executor)
  }

  get(nodeType: string): NodeExecutor | undefined {
    return this.executors.get(nodeType)
  }

  has(nodeType: string): boolean {
    return this.executors.has(nodeType)
  }

  getAll(): Map<string, NodeExecutor> {
    return new Map(this.executors)
  }
}

