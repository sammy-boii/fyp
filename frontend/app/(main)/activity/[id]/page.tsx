'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BadgeCheck,
  Clock,
  Cog,
  ExternalLink,
  Loader2,
  Play,
  Timer,
  WifiOff,
  XCircle
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { TimelineLayout } from '@/components/timeline'
import { cn } from '@/lib/utils'
import { useGetExecutionDetails } from '@/hooks/use-activity'
import { useActivityWebSocket } from '@/hooks/use-activity-websocket'
import type {
  ExecutionEvent,
  ExecutionLog
} from '@/hooks/use-workflow-websocket'
import type { TimelineElement } from '@/types/index.types'
import {
  NODE_DEFINITIONS,
  TRIGGER_NODE_DEFINITIONS
} from '@/constants/registry'
import type { NodeAction } from '@/types/node.types'

type NodeExecutionDetail = {
  id: string
  nodeId: string
  nodeType: string
  actionId: string
  outputData: any | null
  error: string | null
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

type ExecutionDetail = {
  executionId: string
  workflowId: string
  workflowName: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  triggerType: 'MANUAL' | 'SCHEDULED' | 'WEBHOOK' | 'UNKNOWN'
  durationMs: number | null
  error: string | null
  createdAt: string
  completedAt: string | null
  nodeExecutions: NodeExecutionDetail[]
}

const formatNodeName = (nodeId?: string) => {
  if (!nodeId) return 'Unknown Node'
  return nodeId
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const formatDateTime = (timestamp?: string | null) => {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDurationSeconds = (durationMs?: number | null) => {
  if (durationMs === null || durationMs === undefined) return '—'
  const seconds = durationMs / 1000
  return `${seconds.toFixed(2).replace(/\.00$/, '')}s`
}

const buildStoredLogs = (
  execution?: ExecutionDetail | null
): ExecutionLog[] => {
  if (!execution) return []

  const totalNodes = execution.nodeExecutions.length
  const logs: ExecutionLog[] = []

  const addLog = (event: ExecutionEvent, suffix: string) => {
    logs.push({
      ...event,
      id: `stored-${event.executionId}-${suffix}`
    })
  }

  if (execution.createdAt) {
    addLog(
      {
        type: 'workflow:start',
        workflowId: execution.workflowId,
        executionId: execution.executionId,
        timestamp: execution.createdAt,
        data: {
          progress: { current: 0, total: totalNodes }
        }
      },
      `workflow-start-${execution.createdAt}`
    )
  }

  execution.nodeExecutions.forEach((node, index) => {
    const startTime = node.startedAt ?? node.createdAt
    const progressStart = {
      current: Math.min(index, totalNodes),
      total: totalNodes
    }
    const progressEnd = {
      current: Math.min(index + 1, totalNodes),
      total: totalNodes
    }

    if (startTime) {
      addLog(
        {
          type: 'node:start',
          workflowId: execution.workflowId,
          executionId: execution.executionId,
          timestamp: startTime,
          data: {
            nodeId: node.nodeId,
            actionId: node.actionId,
            status: 'running',
            progress: progressStart
          }
        },
        `node-start-${node.id}-${startTime}`
      )
    }

    if (node.status === 'COMPLETED') {
      const completeTime =
        node.completedAt ??
        startTime ??
        execution.completedAt ??
        execution.createdAt
      if (completeTime) {
        addLog(
          {
            type: 'node:complete',
            workflowId: execution.workflowId,
            executionId: execution.executionId,
            timestamp: completeTime,
            data: {
              nodeId: node.nodeId,
              output: node.outputData ?? undefined,
              status: 'completed',
              progress: progressEnd
            }
          },
          `node-complete-${node.id}-${completeTime}`
        )
      }
    }

    if (node.status === 'FAILED') {
      const errorTime =
        node.completedAt ??
        startTime ??
        execution.completedAt ??
        execution.createdAt
      if (errorTime) {
        addLog(
          {
            type: 'node:error',
            workflowId: execution.workflowId,
            executionId: execution.executionId,
            timestamp: errorTime,
            data: {
              nodeId: node.nodeId,
              error: node.error ?? 'Node failed',
              status: 'failed',
              progress: progressEnd
            }
          },
          `node-error-${node.id}-${errorTime}`
        )
      }
    }
  })

  if (execution.completedAt) {
    if (execution.status === 'COMPLETED') {
      addLog(
        {
          type: 'workflow:complete',
          workflowId: execution.workflowId,
          executionId: execution.executionId,
          timestamp: execution.completedAt,
          data: {
            duration: execution.durationMs ?? undefined,
            status: 'completed'
          }
        },
        `workflow-complete-${execution.completedAt}`
      )
    } else if (
      execution.status === 'FAILED' ||
      execution.status === 'CANCELLED'
    ) {
      const fallbackError =
        execution.status === 'CANCELLED'
          ? 'Workflow cancelled'
          : 'Workflow failed'
      addLog(
        {
          type: 'workflow:error',
          workflowId: execution.workflowId,
          executionId: execution.executionId,
          timestamp: execution.completedAt,
          data: {
            duration: execution.durationMs ?? undefined,
            status: 'failed',
            error: execution.error ?? fallbackError
          }
        },
        `workflow-error-${execution.completedAt}`
      )
    }
  }

  return logs.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

const dedupeLogs = (logs: ExecutionLog[]) => {
  const seen = new Set<string>()
  return logs.filter((log) => {
    const key = `${log.type}-${log.timestamp}-${log.executionId}-${log.data?.nodeId ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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

export default function ActivityExecutionPage() {
  const params = useParams()
  const executionId = params?.id ? String(params.id) : null

  const executionQuery = useGetExecutionDetails(executionId)
  const execution = executionQuery.data?.data as ExecutionDetail | null

  const [liveLogs, setLiveLogs] = useState<ExecutionLog[]>([])
  const [liveExecution, setLiveExecution] = useState<{
    id: string
    status: 'running' | 'completed' | 'failed'
    progress?: { current: number; total: number }
  } | null>(null)

  const workflowIds = useMemo(
    () => (execution?.workflowId ? [execution.workflowId] : []),
    [execution?.workflowId]
  )

  const { isConnected } = useActivityWebSocket(workflowIds, {
    enabled: workflowIds.length > 0,
    onEvent: (event) => {
      if (!executionId || event.executionId !== executionId) return

      const logEntry: ExecutionLog = {
        ...event,
        id: `${event.executionId}-${event.timestamp}-${Math.random().toString(36).slice(2, 9)}`
      }
      setLiveLogs((prev) => [...prev, logEntry])

      switch (event.type) {
        case 'workflow:start':
          setLiveExecution({
            id: event.executionId,
            status: 'running',
            progress: event.data?.progress
          })
          break
        case 'node:start':
        case 'node:complete':
          setLiveExecution((prev) =>
            prev
              ? {
                  ...prev,
                  progress: event.data?.progress ?? prev.progress
                }
              : null
          )
          break
        case 'node:error':
          setLiveExecution((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'failed',
                  progress: event.data?.progress ?? prev.progress
                }
              : null
          )
          break
        case 'workflow:complete':
          setLiveExecution((prev) =>
            prev ? { ...prev, status: 'completed' } : null
          )
          break
        case 'workflow:error':
          setLiveExecution((prev) =>
            prev ? { ...prev, status: 'failed' } : null
          )
          break
      }
    }
  })

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

  const nodeActionIdById = useMemo(() => {
    if (!execution) return {}
    return execution.nodeExecutions.reduce<Record<string, string>>(
      (acc, node) => {
        if (node.nodeId && node.actionId) {
          acc[node.nodeId] = node.actionId
        }
        return acc
      },
      {}
    )
  }, [execution])

  const storedLogs = useMemo(() => buildStoredLogs(execution), [execution])
  const mergedLogs = useMemo(() => {
    const combined = dedupeLogs([...storedLogs, ...liveLogs])
    return combined.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }, [storedLogs, liveLogs])

  const activeNodeId = useMemo(() => getActiveNodeId(mergedLogs), [mergedLogs])

  const timelineItems: TimelineElement[] = useMemo(() => {
    return mergedLogs.map((log, index) => {
      const hasOutput =
        log.data?.output && Object.keys(log.data.output).length > 0
      const hasError = !!log.data?.error
      const actionId =
        log.data?.actionId ?? nodeActionIdById[log.data?.nodeId || '']
      const actionLabel = actionId ? actionLabelMap.get(actionId) : null
      const fallbackNodeLabel = formatNodeName(log.data?.nodeId)
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
          case 'workflow:complete':
            return <BadgeCheck className='h-5 w-5' />
          case 'node:error':
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

      const buildDescription = () => {
        if (log.data?.duration) {
          const duration = formatDurationSeconds(log.data.duration)
          return duration ? `Completed in ${duration}` : ''
        }
        return ''
      }

      const getExpandableContent = () => {
        if (hasError && log.data?.error) {
          return {
            type: 'error' as const,
            content: log.data.error
          }
        }
        if (hasOutput && log.data?.output) {
          return {
            type: 'output' as const,
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
      }
    })
  }, [mergedLogs, activeNodeId, actionLabelMap, nodeActionIdById])

  const fallbackProgress = useMemo(() => {
    if (!execution || execution.nodeExecutions.length === 0) return undefined
    const completedCount = execution.nodeExecutions.filter(
      (node) => node.status === 'COMPLETED'
    ).length
    const failedCount = execution.nodeExecutions.filter(
      (node) => node.status === 'FAILED'
    ).length
    return {
      current: Math.min(
        completedCount + failedCount,
        execution.nodeExecutions.length
      ),
      total: execution.nodeExecutions.length
    }
  }, [execution])

  const currentExecution =
    liveExecution ??
    (execution?.status === 'RUNNING'
      ? {
          id: execution.executionId,
          status: 'running',
          progress: fallbackProgress
        }
      : null)

  const progressValue =
    currentExecution?.progress && currentExecution.progress.total > 0
      ? (currentExecution.progress.current / currentExecution.progress.total) *
        100
      : 0
  const clampedProgress = Math.min(Math.max(progressValue, 0), 100)

  if (executionQuery.isLoading) {
    return (
      <div className='w-full bg-background'>
        <div className='mx-auto flex flex-col gap-6 p-8'>
          <div className='space-y-4'>
            <div className='flex items-start justify-between'>
              <div className='space-y-2'>
                <Skeleton className='h-8 w-48' />
                <Skeleton className='h-5 w-32' />
              </div>
              <Skeleton className='h-8 w-28' />
            </div>
          </div>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='rounded-lg border bg-card p-4'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-9 w-9 rounded-md' />
                  <div className='space-y-1.5'>
                    <Skeleton className='h-3 w-12' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className='rounded-lg border bg-card'>
            <div className='border-b px-6 py-4'>
              <Skeleton className='h-5 w-36' />
            </div>
            <div className='space-y-4 p-6'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-12' />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (executionQuery.isError || executionQuery.data?.error || !execution) {
    return (
      <div className='w-full bg-background'>
        <div className='mx-auto flex flex-col gap-6 p-8'>
          <div className='flex min-h-[50vh] items-center justify-center rounded-lg border border-dashed bg-card'>
            <Empty className='border-none'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <div className='rounded-full bg-destructive/10 p-3'>
                    <XCircle className='h-6 w-6 text-destructive' />
                  </div>
                </EmptyMedia>
                <EmptyTitle className='text-xl'>
                  Unable to load execution
                </EmptyTitle>
                <EmptyDescription className='max-w-sm'>
                  We couldn&apos;t fetch this execution. Try returning to the
                  activity list and selecting it again.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </div>
      </div>
    )
  }

  const statusBadge = (() => {
    switch (execution.status) {
      case 'RUNNING':
        return (
          <Badge
            variant='outline'
            className='text-amber-600 border-amber-500/50 gap-1.5'
          >
            <Clock className='h-3 w-3' />
            Running
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge
            variant='outline'
            className='text-emerald-600 border-emerald-500/50 gap-1.5'
          >
            <BadgeCheck className='h-3 w-3' />
            Completed
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge
            variant='outline'
            className='text-destructive border-destructive/60 gap-1.5'
          >
            <XCircle className='h-3 w-3' />
            Failed
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant='outline' className='text-muted-foreground gap-1.5'>
            <Clock className='h-3 w-3' />
            Cancelled
          </Badge>
        )
    }
  })()

  return (
    <div className='w-full bg-background'>
      <div className='mx-auto flex flex-col gap-6 p-8'>
        {/* Page Header */}
        <div className='space-y-4'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='space-y-1'>
              <div className='flex items-center gap-3'>
                <h1 className='text-2xl font-semibold tracking-tight'>
                  {execution.workflowName}
                </h1>
                {statusBadge}
              </div>
            </div>
            <div className='flex items-center gap-3'>
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
                <div className='flex items-center gap-1.5 text-sm text-red-500'>
                  <WifiOff className='h-3.5 w-3.5' />
                  <span>Offline</span>
                </div>
              )}
              <Button
                variant='ghost'
                size='sm'
                className='h-8 text-muted-foreground'
                asChild
              >
                <a href={`/workflows/${execution.workflowId}`}>
                  <ExternalLink className='h-3.5 w-3.5 mr-1.5' />
                  View Workflow
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
          <div className='group relative rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10'>
                <Play className='h-4 w-4 text-primary' />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                  Trigger
                </p>
                <p className='truncate text-sm font-semibold capitalize'>
                  {execution.triggerType.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
          <div className='group relative rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500/10'>
                <Clock className='h-4 w-4 text-amber-500' />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                  Started
                </p>
                <p className='truncate text-sm font-semibold'>
                  {formatDateTime(execution.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <div className='group relative rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10'>
                <BadgeCheck className='h-4 w-4 text-emerald-500' />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                  Completed
                </p>
                <p className='truncate text-sm font-semibold'>
                  {formatDateTime(execution.completedAt)}
                </p>
              </div>
            </div>
          </div>
          <div className='group relative rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-500/10'>
                <Timer className='h-4 w-4 text-violet-500' />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                  Duration
                </p>
                <p className='truncate text-sm font-semibold'>
                  {formatDurationSeconds(execution.durationMs)}
                </p>
              </div>
            </div>
          </div>
          <div className='group relative rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-500/10'>
                <Cog className='h-4 w-4 text-slate-500' />
              </div>
              <div className='min-w-0'>
                <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                  Steps
                </p>
                <p className='truncate text-sm font-semibold'>
                  {execution.nodeExecutions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card - Running State */}
        {currentExecution?.status === 'running' &&
          currentExecution.progress &&
          currentExecution.progress.total > 0 && (
            <div className='rounded-lg border border-primary/20 bg-primary/5 p-4'>
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

        {/* Timeline Section */}
        <div className='rounded-lg border bg-card'>
          <div className='flex items-center justify-between border-b px-6 py-4'>
            <div className='flex items-center gap-3'>
              <h2 className='text-sm font-semibold'>Execution Timeline</h2>
              <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground'>
                {mergedLogs.length}
              </span>
            </div>
          </div>
          <div className='p-6'>
            {timelineItems.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
                <Clock className='h-10 w-10 mb-3 opacity-20' />
                <p className='text-sm font-medium'>No events yet</p>
                <p className='text-xs mt-1 text-muted-foreground/70'>
                  Waiting for execution logs
                </p>
              </div>
            ) : (
              <TimelineLayout
                animate
                items={timelineItems}
                size='md'
                className='mx-0 max-w-none'
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
