import type { ExecutionEventType } from '@/hooks/use-workflow-websocket'

export type ActivityTriggerType =
  | 'MANUAL'
  | 'SCHEDULED'
  | 'WEBHOOK'
  | 'UNKNOWN'

export type ActivityExecutionRow = {
  executionId: string
  workflowId: string
  workflowName: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  triggerType: ActivityTriggerType
  durationMs: number | null
  error: string | null
  createdAt: string
  completedAt: string | null
  nodeCount: number
  lastEventType?: ExecutionEventType | null
  lastEventAt?: string | null
  progress?: { current: number; total: number } | null
}
