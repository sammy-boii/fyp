'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ExecutionEvent } from './use-workflow-websocket'

type UseActivityWebSocketOptions = {
  enabled?: boolean
  onEvent?: (event: ExecutionEvent) => void
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'

export function useActivityWebSocket(
  workflowIds: string[],
  options: UseActivityWebSocketOptions = {}
) {
  const { enabled = true, onEvent } = options
  const [connectedCount, setConnectedCount] = useState(0)

  const wsMapRef = useRef(new Map<string, WebSocket>())
  const pingIntervalsRef = useRef(new Map<string, NodeJS.Timeout>())
  const connectingRef = useRef(new Set<string>())
  const onEventRef = useRef(onEvent)

  const workflowKey = useMemo(
    () => workflowIds.filter(Boolean).sort().join('|'),
    [workflowIds]
  )

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const updateConnectedCount = () => {
    let count = 0
    wsMapRef.current.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        count += 1
      }
    })
    setConnectedCount(count)
  }

  useEffect(() => {
    if (!enabled) return undefined

    const ids = workflowIds.filter(Boolean)
    const idSet = new Set(ids)

    // Close connections for workflows no longer tracked
    wsMapRef.current.forEach((socket, id) => {
      if (!idSet.has(id)) {
        socket.close()
        wsMapRef.current.delete(id)
        connectingRef.current.delete(id)
        const ping = pingIntervalsRef.current.get(id)
        if (ping) {
          clearInterval(ping)
          pingIntervalsRef.current.delete(id)
        }
      }
    })

    ids.forEach((workflowId) => {
      if (wsMapRef.current.has(workflowId)) return
      if (connectingRef.current.has(workflowId)) return

      connectingRef.current.add(workflowId)

      const ws = new WebSocket(`${WS_BASE_URL}/ws/workflow/${workflowId}`)
      wsMapRef.current.set(workflowId, ws)

      ws.onopen = () => {
        connectingRef.current.delete(workflowId)
        updateConnectedCount()

        const ping = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000)
        pingIntervalsRef.current.set(workflowId, ping)
      }

      ws.onmessage = (event) => {
        try {
          const data: ExecutionEvent = JSON.parse(event.data)
          if ((data as any).type === 'pong') return
          onEventRef.current?.(data)
        } catch (err) {
          console.error('[Activity WS] Failed to parse message:', err)
        }
      }

      ws.onclose = () => {
        connectingRef.current.delete(workflowId)
        wsMapRef.current.delete(workflowId)
        const ping = pingIntervalsRef.current.get(workflowId)
        if (ping) {
          clearInterval(ping)
          pingIntervalsRef.current.delete(workflowId)
        }
        updateConnectedCount()
      }

      ws.onerror = (error) => {
        console.error('[Activity WS] Error:', error)
        connectingRef.current.delete(workflowId)
      }
    })

    return () => {
      wsMapRef.current.forEach((socket) => socket.close())
      wsMapRef.current.clear()
      pingIntervalsRef.current.forEach((ping) => clearInterval(ping))
      pingIntervalsRef.current.clear()
      connectingRef.current.clear()
      updateConnectedCount()
    }
  }, [workflowKey, enabled, workflowIds])

  return {
    isConnected: connectedCount > 0,
    connectedCount
  }
}
