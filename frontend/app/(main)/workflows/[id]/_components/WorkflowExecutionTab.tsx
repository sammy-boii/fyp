'use client'

import { ExecutionLog } from '@/hooks/use-workflow-websocket'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TimelineLayout } from '@/components/timeline'
import { cn } from '@/lib/utils'
import {
  BadgeCheck,
  Trash2,
  XCircle,
  Play,
  Loader2,
  WifiOff,
  Clock,
  Timer,
  Cog
} from 'lucide-react'
import { useMemo } from 'react'
import type { TimelineElement } from '@/types/index.types'
import {
  NODE_DEFINITIONS,
  TRIGGER_NODE_DEFINITIONS
} from '@/constants/registry'
import type { NodeAction } from '@/types/node.types'

interface WorkflowExecutionTabProps {
  isConnected: boolean
  executionLogs: ExecutionLog[]
  currentExecution: {
    id: string
    status: 'running' | 'completed' | 'failed'
    progress?: { current: number; total: number }
  } | null
  clearLogs: () => void
  nodeActionIdById?: Record<string, string>
}

const formatNodeName = (nodeId?: string, nodeName?: string) => {
  const raw = nodeName || nodeId
  if (!raw) return 'Unknown Node'

  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Helper to format timestamp
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDurationSeconds = (durationMs?: number) => {
  if (!durationMs && durationMs !== 0) return null
  const seconds = durationMs / 1000
  return `${seconds.toFixed(2).replace(/\.00$/, '')}s`
}

// Group logs by execution
interface ExecutionGroup {
  executionId: string
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'failed'
  duration?: number
  logs: ExecutionLog[]
}

const WorkflowExecutionTab = ({
  isConnected,
  executionLogs,
  currentExecution,
  clearLogs,
  nodeActionIdById
}: WorkflowExecutionTabProps) => {
  const actionLabelMap = useMemo(() => {
    const map = new Map<string, string>()

    const addActions = (actions?: NodeAction[]) => {
      if (!actions) return
      actions.forEach((action) => {
        if (action?.id && action.label) {
          map.set(action.id, action.label)
        }
      })
    }

    Object.values(NODE_DEFINITIONS).forEach((definition) =>
      addActions(definition.actions)
    )
    Object.values(TRIGGER_NODE_DEFINITIONS).forEach((definition) =>
      addActions(definition.actions)
    )

    return map
  }, [])

  const getActionLabel = (actionId?: string) => {
    if (!actionId) return null
    return actionLabelMap.get(actionId) ?? null
  }

  const getActiveNodeId = (logs: ExecutionLog[]) => {
    const finished = new Set<string>()

    for (let index = logs.length - 1; index >= 0; index -= 1) {
      const log = logs[index]
      const nodeId = log.data?.nodeId
      if (!nodeId) continue

      if (log.type === 'node:complete' || log.type === 'node:error') {
        finished.add(nodeId)
        continue
      }

      if (log.type === 'node:start' && !finished.has(nodeId)) {
        return nodeId
      }
    }

    return null
  }

  // Group logs by execution ID
  const executionGroups: ExecutionGroup[] = useMemo(() => {
    const groups: Map<string, ExecutionGroup> = new Map()

    executionLogs.forEach((log) => {
      const execId = log.executionId

      if (!groups.has(execId)) {
        groups.set(execId, {
          executionId: execId,
          startTime: log.timestamp,
          status: 'running',
          logs: []
        })
      }

      const group = groups.get(execId)!
      group.logs.push(log)

      if (log.type === 'workflow:complete') {
        group.status = 'completed'
        group.endTime = log.timestamp
        group.duration = log.data?.duration
      } else if (log.type === 'workflow:error') {
        group.status = 'failed'
        group.endTime = log.timestamp
      }
    })

    // Reverse to show newest executions first
    return Array.from(groups.values()).reverse()
  }, [executionLogs])

  // Convert execution group logs to timeline items
  const convertLogsToTimeline = (
    logs: ExecutionLog[],
    activeNodeId: string | null
  ): TimelineElement[] => {
    return logs.map((log, index) => {
      const hasOutput =
        log.data?.output && Object.keys(log.data.output).length > 0
      const hasError = !!log.data?.error
      const actionId =
        log.data?.actionId ?? nodeActionIdById?.[log.data?.nodeId || '']
      const actionLabel = getActionLabel(actionId)
      const fallbackNodeLabel = formatNodeName(
        log.data?.nodeId,
        log.data?.nodeName
      )
      const resolvedActionLabel = actionLabel || fallbackNodeLabel

      const getIcon = () => {
        switch (log.type) {
          case 'workflow:start':
            return <Play className='h-5 w-5 animate-pulse' />
          case 'node:start':
            return (
              <Cog
                className={cn(
                  'h-5 w-5',
                  log.data?.nodeId === activeNodeId && 'animate-spin'
                )}
              />
            )
          case 'node:complete':
            return <BadgeCheck className='h-5 w-5' />
          case 'node:error':
            return <XCircle className='h-5 w-5' />
          case 'workflow:complete':
            return <BadgeCheck className='h-5 w-5' />
          case 'workflow:error':
            return <XCircle className='h-5 w-5' />
          default:
            return <Cog className='h-5 w-5' />
        }
      }

      const getColor = (): TimelineElement['color'] => {
        switch (log.type) {
          case 'node:error':
          case 'workflow:error':
            return 'destructive'
          case 'node:start':
            return 'accent'
          case 'workflow:start':
            return 'orange'
          case 'node:complete':
          case 'workflow:complete':
            return 'green'
          default:
            return 'primary'
        }
      }

      const getTitle = () => {
        switch (log.type) {
          case 'workflow:start':
            return 'Workflow Started'
          case 'node:start':
            return `Executing: ${resolvedActionLabel}`
          case 'node:complete':
            return `Completed: ${resolvedActionLabel}`
          case 'node:error':
            return `Failed: ${resolvedActionLabel}`
          case 'workflow:complete':
            return 'Workflow Completed'
          case 'workflow:error':
            return 'Workflow Failed'
          default:
            return log.type
        }
      }

      // Build description
      const buildDescription = () => {
        if (log.data?.duration) {
          const duration = formatDurationSeconds(log.data.duration)
          return duration ? `Completed in ${duration}` : ''
        }
        return ''
      }

      // Build expandable content for output/error
      const getExpandableContent = ():
        | TimelineElement['expandableContent']
        | undefined => {
        if (hasError && log.data?.error) {
          return {
            type: 'error',
            content: log.data.error
          }
        }
        if (hasOutput && log.data?.output) {
          return {
            type: 'output',
            content: JSON.stringify(log.data.output, null, 2)
          }
        }
        return undefined
      }

      return {
        id: index + 1,
        date: formatTime(log.timestamp),
        title: getTitle(),
        description: buildDescription(),
        icon: getIcon(),
        color: getColor(),
        status:
          log.type.includes('complete') || log.type.includes('error')
            ? 'completed'
            : log.type.includes('start')
              ? 'in-progress'
              : ('pending' as const),
        expandableContent: getExpandableContent()
      } satisfies TimelineElement
    })
  }

  const getStatusBadge = (status: 'running' | 'completed' | 'failed') => {
    switch (status) {
      case 'running':
        return (
          <Badge
            variant='outline'
            className='text-yellow-600 border-yellow-600'
          >
            Running
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant='outline' className='text-green-600 border-green-600'>
            Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge
            variant='outline'
            className='text-destructive border-destructive'
          >
            Failed
          </Badge>
        )
    }
  }

  const progressValue = currentExecution?.progress
    ? (currentExecution.progress.current / currentExecution.progress.total) *
      100
    : 0
  const clampedProgress = Math.min(Math.max(progressValue, 0), 100)
  const showProgress = currentExecution?.status === 'running'

  return (
    <div className='h-[90vh] flex flex-col p-6'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-3'>
            <h2 className='text-xl font-semibold'>Execution History</h2>
            <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground'>
              {executionGroups.length}
            </span>
          </div>
          {isConnected ? (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span className='relative flex size-2'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60' />
                <span className='relative inline-flex size-2 rounded-full bg-emerald-500' />
              </span>
              <span className='text-emerald-600 dark:text-emerald-400 font-medium'>
                Live
              </span>
            </div>
          ) : (
            <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
              <WifiOff className='h-3.5 w-3.5' />
              <span>Offline</span>
            </div>
          )}
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={clearLogs}
          disabled={executionLogs.length === 0}
        >
          <Trash2 className='h-4 w-4 mr-2' />
          Clear
        </Button>
      </div>

      {/* Progress Bar for current execution */}
      {currentExecution && showProgress && currentExecution.progress && (
        <div className='rounded-lg border border-primary/20 bg-primary/5 p-4 mb-6'>
          <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
            <div className='flex items-center gap-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10'>
                <Loader2 className='h-4 w-4 text-primary animate-spin' />
              </div>
              <div>
                <p className='text-sm font-medium'>Executing workflow</p>
                <p className='text-xs text-muted-foreground'>
                  Streaming live updates
                </p>
              </div>
            </div>
            <span className='text-sm font-medium tabular-nums'>
              {currentExecution.progress.current} /{' '}
              {currentExecution.progress.total}
            </span>
          </div>
          <Progress value={clampedProgress} className='h-1.5' />
        </div>
      )}

      {/* Execution Groups */}
      <div className='flex-1 relative'>
        <ScrollArea className='h-full'>
          {executionGroups.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
              <Clock className='h-10 w-10 mb-3 opacity-20' />
              <p className='text-sm font-medium'>No execution history</p>
              <p className='text-xs mt-1 text-muted-foreground/70'>
                Run your workflow to see execution logs here
              </p>
            </div>
          ) : (
            <div className='space-y-6 pb-6'>
              {executionGroups.map((group) => (
                <div
                  key={group.executionId}
                  className='rounded-lg border bg-card overflow-hidden'
                >
                  <div className='flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4'>
                    <div className='flex items-center gap-3'>
                      <h3 className='text-sm font-semibold'>
                        Workflow Execution
                      </h3>
                      {getStatusBadge(group.status)}
                    </div>
                    <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                      <span className='font-medium'>
                        {formatDateTime(group.startTime)}
                      </span>
                      {group.duration && (
                        <span className='flex items-center gap-1 font-mono rounded-full bg-muted px-2 py-0.5'>
                          <Timer className='h-3 w-3' />
                          {formatDurationSeconds(group.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='p-6'>
                    <TimelineLayout
                      animate
                      items={convertLogsToTimeline(
                        group.logs,
                        getActiveNodeId(group.logs)
                      )}
                      size='md'
                      className='mx-0 max-w-none'
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export default WorkflowExecutionTab
