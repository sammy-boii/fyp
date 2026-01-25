'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export type ExecutionEventType =
  | 'workflow:start'
  | 'node:start'
  | 'node:complete'
  | 'node:error'
  | 'workflow:complete'
  | 'workflow:error'

export type ExecutionEvent = {
  type: ExecutionEventType
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

export type ExecutionLog = ExecutionEvent & {
  id: string
}

type UseWorkflowWebSocketOptions = {
  enabled?: boolean
  onEvent?: (event: ExecutionEvent) => void
  onNodeStart?: (nodeId: string) => void
  onNodeComplete?: (nodeId: string, output?: any) => void
  onNodeError?: (nodeId: string, error?: string) => void
  onWorkflowComplete?: (duration?: number) => void
  onWorkflowError?: (error?: string) => void
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'

export function useWorkflowWebSocket(
  workflowId: string | null,
  options: UseWorkflowWebSocketOptions = {}
) {
  const {
    enabled = true,
    onEvent,
    onNodeStart,
    onNodeComplete,
    onNodeError,
    onWorkflowComplete,
    onWorkflowError
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([])
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null)
  const [currentExecution, setCurrentExecution] = useState<{
    id: string
    status: 'running' | 'completed' | 'failed'
    progress?: { current: number; total: number }
  } | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)

  // Store callbacks in refs to avoid reconnection loops
  const callbacksRef = useRef({
    onEvent,
    onNodeStart,
    onNodeComplete,
    onNodeError,
    onWorkflowComplete,
    onWorkflowError
  })

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onEvent,
      onNodeStart,
      onNodeComplete,
      onNodeError,
      onWorkflowComplete,
      onWorkflowError
    }
  }, [
    onEvent,
    onNodeStart,
    onNodeComplete,
    onNodeError,
    onWorkflowComplete,
    onWorkflowError
  ])

  const clearLogs = useCallback(() => {
    setExecutionLogs([])
    setExecutingNodeId(null)
    setCurrentExecution(null)
  }, [])

  const connect = useCallback(() => {
    if (!workflowId || !enabled) return

    // Prevent multiple simultaneous connection attempts
    if (
      isConnectingRef.current ||
      (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)
    ) {
      return
    }

    isConnectingRef.current = true

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    const wsUrl = `${WS_BASE_URL}/ws/workflow/${workflowId}`
    console.log(`[WebSocket] Connecting to ${wsUrl}`)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[WebSocket] Connected')
      setIsConnected(true)
      isConnectingRef.current = false

      // Start ping interval to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)
    }

    ws.onmessage = (event) => {
      try {
        const data: ExecutionEvent = JSON.parse(event.data)

        // Ignore pong messages
        if ((data as any).type === 'pong') return

        console.log('[WebSocket] Received event:', data.type, data)

        // Add to logs with unique ID
        const logEntry: ExecutionLog = {
          ...data,
          id: `${data.executionId}-${data.timestamp}-${Math.random().toString(36).substr(2, 9)}`
        }
        setExecutionLogs((prev) => [...prev, logEntry])

        // Call general event handler
        callbacksRef.current.onEvent?.(data)

        // Update state based on event type
        switch (data.type) {
          case 'workflow:start':
            setCurrentExecution({
              id: data.executionId,
              status: 'running',
              progress: data.data?.progress
            })
            setExecutingNodeId(null)
            break

          case 'node:start':
            setExecutingNodeId(data.data?.nodeId || null)
            setCurrentExecution((prev) =>
              prev
                ? {
                    ...prev,
                    progress: data.data?.progress
                  }
                : null
            )
            callbacksRef.current.onNodeStart?.(data.data?.nodeId || '')
            break

          case 'node:complete':
            setExecutingNodeId(null)
            setCurrentExecution((prev) =>
              prev
                ? {
                    ...prev,
                    progress: data.data?.progress
                  }
                : null
            )
            callbacksRef.current.onNodeComplete?.(
              data.data?.nodeId || '',
              data.data?.output
            )
            break

          case 'node:error':
            setExecutingNodeId(null)
            callbacksRef.current.onNodeError?.(
              data.data?.nodeId || '',
              data.data?.error
            )
            break

          case 'workflow:complete':
            setCurrentExecution((prev) =>
              prev
                ? {
                    ...prev,
                    status: 'completed'
                  }
                : null
            )
            setExecutingNodeId(null)
            callbacksRef.current.onWorkflowComplete?.(data.data?.duration)
            break

          case 'workflow:error':
            setCurrentExecution((prev) =>
              prev
                ? {
                    ...prev,
                    status: 'failed'
                  }
                : null
            )
            setExecutingNodeId(null)
            callbacksRef.current.onWorkflowError?.(data.data?.error)
            break
        }
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e)
      }
    }

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected')
      setIsConnected(false)
      isConnectingRef.current = false

      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }

      // Don't auto-reconnect - let the user trigger reconnection if needed
    }

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
      isConnectingRef.current = false
    }
  }, [workflowId, enabled])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
  }, [])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled && workflowId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [workflowId, enabled, connect, disconnect])

  return {
    isConnected,
    executionLogs,
    executingNodeId,
    currentExecution,
    clearLogs,
    connect,
    disconnect
  }
}
