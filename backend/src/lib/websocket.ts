import { TActionID } from '@shared/constants'
import type { ServerWebSocket } from 'bun'

const WS_MAX_EVENT_BYTES = parsePositiveInt(
  process.env.WS_MAX_EVENT_BYTES,
  512 * 1024
)

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function formatBytes(bytes: number): string {
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`
  }
  const mb = kb / 1024
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
}

function buildMessage(event: ExecutionEvent): string {
  let message = JSON.stringify(event)

  if (message.length <= WS_MAX_EVENT_BYTES) {
    return message
  }

  // If node output is too large for real-time transport, downgrade to an explicit node:error event.
  if (event.type === 'node:complete') {
    const oversizedEvent: ExecutionEvent = {
      type: 'node:error',
      workflowId: event.workflowId,
      executionId: event.executionId,
      timestamp: new Date().toISOString(),
      data: {
        nodeId: event.data?.nodeId,
        nodeName: event.data?.nodeName,
        actionId: event.data?.actionId,
        error: `Node output exceeded realtime payload limit (${formatBytes(WS_MAX_EVENT_BYTES)}). Reduce data size or disable include content for bulk files.`,
        status: 'failed',
        progress: event.data?.progress
      }
    }

    return JSON.stringify(oversizedEvent)
  }

  const fallbackEvent: ExecutionEvent = {
    type: 'workflow:error',
    workflowId: event.workflowId,
    executionId: event.executionId,
    timestamp: new Date().toISOString(),
    data: {
      error: `Workflow event payload exceeded realtime limit (${formatBytes(WS_MAX_EVENT_BYTES)}).`,
      status: 'failed'
    }
  }

  return JSON.stringify(fallbackEvent)
}

// Store active WebSocket connections by workflowId
const connections = new Map<
  string,
  Set<ServerWebSocket<{ workflowId: string }>>
>()

export type ExecutionEvent = {
  type:
    | 'workflow:start'
    | 'node:start'
    | 'node:complete'
    | 'node:error'
    | 'workflow:complete'
    | 'workflow:error'
  workflowId: string
  executionId: string
  timestamp: string
  data?: {
    nodeId?: string
    nodeName?: string
    actionId?: string
    output?: any
    error?: string
    duration?: number
    status?: 'running' | 'completed' | 'failed'
    progress?: {
      current: number
      total: number
    }
  }
}

export const websocketHandler = {
  open(ws: ServerWebSocket<{ workflowId: string }>) {
    const workflowId = ws.data.workflowId

    if (!connections.has(workflowId)) {
      connections.set(workflowId, new Set())
    }
    connections.get(workflowId)!.add(ws)
  },

  close(ws: ServerWebSocket<{ workflowId: string }>) {
    const workflowId = ws.data.workflowId

    const workflowConnections = connections.get(workflowId)
    if (workflowConnections) {
      workflowConnections.delete(ws)
      if (workflowConnections.size === 0) {
        connections.delete(workflowId)
      }
    }
  },

  message(
    ws: ServerWebSocket<{ workflowId: string }>,
    message: string | Buffer
  ) {
    // Handle incoming messages if needed (e.g., ping/pong, cancel execution)
    try {
      const data = JSON.parse(message.toString())
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }))
      }
    } catch (e) {
      // Ignore invalid messages
    }
  }
}

// Broadcast execution event to all connected clients for a workflow
export function broadcastExecutionEvent(event: ExecutionEvent) {
  const workflowConnections = connections.get(event.workflowId)

  if (!workflowConnections || workflowConnections.size === 0) {
    return
  }

  const message = buildMessage(event)

  workflowConnections.forEach((ws) => {
    try {
      ws.send(message)
    } catch (e) {}
  })
}

// Helper to emit workflow start event
export function emitWorkflowStart(
  workflowId: string,
  executionId: string,
  totalNodes: number
) {
  broadcastExecutionEvent({
    type: 'workflow:start',
    workflowId,
    executionId,
    timestamp: new Date().toISOString(),
    data: {
      progress: { current: 0, total: totalNodes }
    }
  })
}

// Helper to emit node start event
export function emitNodeStart(
  workflowId: string,
  executionId: string,
  nodeId: string,
  nodeName: string,
  actionId: TActionID,
  progress: { current: number; total: number }
) {
  broadcastExecutionEvent({
    type: 'node:start',
    workflowId,
    executionId,
    timestamp: new Date().toISOString(),
    data: {
      nodeId,
      nodeName,
      actionId,
      status: 'running',
      progress
    }
  })
}

// Helper to emit node complete event
export function emitNodeComplete(
  workflowId: string,
  executionId: string,
  nodeId: string,
  output: any,
  progress: { current: number; total: number }
) {
  broadcastExecutionEvent({
    type: 'node:complete',
    workflowId,
    executionId,
    timestamp: new Date().toISOString(),
    data: {
      nodeId,
      output,
      status: 'completed',
      progress
    }
  })
}

// Helper to emit node error event
export function emitNodeError(
  workflowId: string,
  executionId: string,
  nodeId: string,
  error: string,
  progress: { current: number; total: number }
) {
  broadcastExecutionEvent({
    type: 'node:error',
    workflowId,
    executionId,
    timestamp: new Date().toISOString(),
    data: {
      nodeId,
      error,
      status: 'failed',
      progress
    }
  })
}

// Helper to emit workflow complete event
export function emitWorkflowComplete(
  workflowId: string,
  executionId: string,
  duration: number
) {
  broadcastExecutionEvent({
    type: 'workflow:complete',
    workflowId,
    executionId,
    timestamp: new Date().toISOString(),
    data: {
      duration,
      status: 'completed'
    }
  })
}

// Helper to emit workflow error event
export function emitWorkflowError(
  workflowId: string,
  executionId: string,
  error: string,
  duration: number
) {
  broadcastExecutionEvent({
    type: 'workflow:error',
    workflowId,
    executionId,
    timestamp: new Date().toISOString(),
    data: {
      error,
      duration,
      status: 'failed'
    }
  })
}
