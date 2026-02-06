'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Clock,
  Signal,
  Trash2,
  WifiOff,
  XCircle,
  Zap
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import {
  useClearUserExecutionActivity,
  useGetUserExecutionActivity
} from '@/hooks/use-activity'
import { useGetWorkflows } from '@/hooks/use-workflows'
import { useActivityWebSocket } from '@/hooks/use-activity-websocket'
import type { ExecutionEvent } from '@/hooks/use-workflow-websocket'
import { cn } from '@/lib/utils'

import { DataTable } from './data-table'
import { columns } from './columns'
import type { ActivityExecutionRow } from './types'

const ActivityPage = () => {
  const activityQuery = useGetUserExecutionActivity()
  const workflowsQuery = useGetWorkflows()
  const clearActivity = useClearUserExecutionActivity()

  const [rows, setRows] = useState<ActivityExecutionRow[]>([])

  const workflowMap = useMemo(() => {
    const map = new Map<string, string>()
    workflowsQuery.data?.data?.forEach((workflow) => {
      map.set(workflow.id, workflow.name)
    })
    return map
  }, [workflowsQuery.data?.data])

  const workflowIds = useMemo(
    () => workflowsQuery.data?.data?.map((workflow) => workflow.id) ?? [],
    [workflowsQuery.data?.data]
  )

  const { connectedCount, isConnected } = useActivityWebSocket(workflowIds, {
    enabled: workflowIds.length > 0,
    onEvent: (event) => {
      setRows((prev) => applyEventToRows(prev, event, workflowMap))
    }
  })

  useEffect(() => {
    if (!activityQuery.data?.data) return

    setRows((prev) => mergeActivityRows(activityQuery.data?.data ?? [], prev))
  }, [activityQuery.data?.data])

  const totalExecutions = rows.length
  const runningCount = rows.filter((row) => row.status === 'RUNNING').length
  const completedCount = rows.filter((row) => row.status === 'COMPLETED').length
  const failedCount = rows.filter((row) => row.status === 'FAILED').length

  return (
    <div className='w-full bg-background'>
      <div className='mx-auto flex flex-col gap-6 p-8'>
        {/* Header Section */}
        <header className='flex flex-col gap-6'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                <Activity className='h-5 w-5 text-primary' />
              </div>
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <h1 className='text-2xl font-semibold leading-tight'>
                    Activity
                  </h1>
                  {totalExecutions > 0 && (
                    <Badge variant='secondary' className='text-xs'>
                      {totalExecutions} executions
                    </Badge>
                  )}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Track and monitor your workflow executions in real-time.
                </p>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              {isConnected ? (
                <Badge
                  variant='outline'
                  className='gap-1.5 border-emerald-500/50 text-emerald-600'
                >
                  <span className='relative flex h-2 w-2'>
                    <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60' />
                    <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500' />
                  </span>
                  <Signal className='h-3 w-3' />
                  Live ({connectedCount})
                </Badge>
              ) : (
                <Badge
                  variant='outline'
                  className='border-red-600 text-red-600'
                >
                  <WifiOff className='mr-1 h-3 w-3' />
                  Offline
                </Badge>
              )}
              <Button
                variant='outline'
                size='sm'
                className='gap-2'
                disabled={rows.length === 0 || clearActivity.isPending}
                onClick={() =>
                  clearActivity.mutate(undefined, {
                    onSuccess: () => setRows([])
                  })
                }
              >
                <Trash2 className='h-4 w-4' />
                Clear logs
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <StatsCard
              label='Total'
              value={totalExecutions}
              icon={<Zap className='h-5 w-5' />}
              variant='default'
            />
            <StatsCard
              label='Running'
              value={runningCount}
              icon={<Clock className='h-5 w-5' />}
              variant='running'
              pulse={runningCount > 0}
            />
            <StatsCard
              label='Completed'
              value={completedCount}
              icon={<CheckCircle2 className='h-5 w-5' />}
              variant='completed'
            />
            <StatsCard
              label='Failed'
              value={failedCount}
              icon={<XCircle className='h-5 w-5' />}
              variant='failed'
            />
          </div>
        </header>

        {/* Main Content */}
        {activityQuery.isLoading ? (
          <div className='space-y-6'>
            {/* Toolbar Skeleton */}
            <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
              <div className='flex flex-1 flex-wrap items-center gap-2'>
                <Skeleton className='h-9 w-full md:w-[320px] rounded-lg' />
                <Skeleton className='h-9 w-24 rounded-lg' />
                <Skeleton className='h-9 w-24 rounded-lg' />
              </div>
              <Skeleton className='h-9 w-20 rounded-lg' />
            </div>
            {/* Table Skeleton */}
            <Card className='overflow-hidden border-0 shadow-md'>
              <div className='border-b bg-muted/30 px-6 py-3'>
                <div className='flex items-center gap-6'>
                  {[
                    'Workflow',
                    'Status',
                    'Trigger',
                    'Steps',
                    'Duration',
                    'Started'
                  ].map((h, i) => (
                    <Skeleton
                      key={h}
                      className={cn('h-4', i === 0 ? 'w-36' : 'w-20')}
                    />
                  ))}
                </div>
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-6 border-b px-6 py-4 last:border-b-0'
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className='flex items-center gap-3 flex-1'>
                    <Skeleton className='h-9 w-9 rounded-lg' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                  <Skeleton className='h-6 w-20 rounded-full' />
                  <Skeleton className='h-6 w-16 rounded-full' />
                  <Skeleton className='h-4 w-10' />
                  <Skeleton className='h-4 w-14' />
                  <Skeleton className='h-4 w-24' />
                </div>
              ))}
            </Card>
          </div>
        ) : activityQuery.isError || activityQuery.data?.error ? (
          <Card className='flex min-h-[50vh] items-center justify-center border-dashed'>
            <Empty className='border-none'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <div className='rounded-full bg-destructive/10 p-3'>
                    <XCircle className='h-6 w-6 text-destructive' />
                  </div>
                </EmptyMedia>
                <EmptyTitle className='text-xl'>
                  Unable to load activity
                </EmptyTitle>
                <EmptyDescription className='max-w-sm'>
                  We couldn&apos;t fetch your execution history. Check your
                  connection and try refreshing the page.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : rows.length === 0 ? (
          <Card className='flex min-h-[50vh] items-center justify-center border-dashed'>
            <Empty className='border-none'>
              <EmptyHeader>
                <EmptyMedia>
                  <div className='relative'>
                    <div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 via-primary/5 to-transparent ring-1 ring-primary/10'>
                      <Clock className='h-10 w-10 text-primary/60' />
                    </div>
                    <div className='absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border'>
                      <Zap className='h-4 w-4 text-muted-foreground' />
                    </div>
                  </div>
                </EmptyMedia>
                <EmptyTitle className='text-xl mt-4'>
                  No activity yet
                </EmptyTitle>
                <EmptyDescription className='max-w-sm'>
                  Your workflow executions will appear here. Run a workflow to
                  start tracking your automation history.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </div>
    </div>
  )
}

const mergeActivityRows = (
  incoming: ActivityExecutionRow[],
  existing: ActivityExecutionRow[]
) => {
  if (existing.length === 0) return incoming

  const existingMap = new Map(existing.map((row) => [row.executionId, row]))

  const toTime = (value?: string | null) => {
    if (!value) return 0
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 0 : date.getTime()
  }

  return incoming.map((row) => {
    const previous = existingMap.get(row.executionId)
    if (!previous) return row

    const previousEventTime = toTime(previous.lastEventAt)
    const rowTime = Math.max(toTime(row.completedAt), toTime(row.createdAt))
    const usePrevious = previousEventTime > rowTime

    return {
      ...row,
      status: usePrevious ? previous.status : row.status,
      durationMs: usePrevious ? previous.durationMs : row.durationMs,
      completedAt: usePrevious ? previous.completedAt : row.completedAt,
      error: usePrevious ? previous.error : row.error,
      lastEventAt: previous.lastEventAt ?? row.lastEventAt,
      lastEventType: previous.lastEventType ?? row.lastEventType,
      progress: previous.progress ?? row.progress,
      nodeCount: Math.max(previous.nodeCount ?? 0, row.nodeCount ?? 0)
    }
  })
}

const applyEventToRows = (
  rows: ActivityExecutionRow[],
  event: ExecutionEvent,
  workflowMap: Map<string, string>
) => {
  const index = rows.findIndex((row) => row.executionId === event.executionId)
  const existing = index >= 0 ? rows[index] : null
  const workflowName =
    existing?.workflowName ??
    workflowMap.get(event.workflowId) ??
    'Unknown workflow'

  const base: ActivityExecutionRow =
    existing ??
    ({
      executionId: event.executionId,
      workflowId: event.workflowId,
      workflowName,
      status: 'RUNNING',
      triggerType: 'UNKNOWN',
      durationMs: null,
      error: null,
      createdAt: event.timestamp,
      completedAt: null,
      nodeCount: event.data?.progress?.total ?? 0,
      lastEventType: null,
      lastEventAt: null,
      progress: null
    } as ActivityExecutionRow)

  const next: ActivityExecutionRow = {
    ...base,
    workflowName,
    lastEventType: event.type,
    lastEventAt: event.timestamp
  }

  if (event.data?.progress) {
    next.progress = event.data.progress
    if (
      event.data.progress.total &&
      event.data.progress.total > next.nodeCount
    ) {
      next.nodeCount = event.data.progress.total
    }
  }

  switch (event.type) {
    case 'workflow:start':
      next.status = 'RUNNING'
      next.createdAt = event.timestamp
      next.error = null
      break
    case 'node:start':
      next.status = 'RUNNING'
      break
    case 'node:complete':
      next.status = base.status === 'FAILED' ? base.status : 'RUNNING'
      break
    case 'node:error':
      next.status = 'FAILED'
      next.error = event.data?.error ?? base.error
      break
    case 'workflow:complete':
      next.status = 'COMPLETED'
      next.durationMs = event.data?.duration ?? base.durationMs
      next.completedAt = event.timestamp
      next.error = null
      break
    case 'workflow:error':
      next.status = 'FAILED'
      next.durationMs = event.data?.duration ?? base.durationMs
      next.completedAt = event.timestamp
      next.error = event.data?.error ?? base.error
      break
  }

  if (index === -1) {
    return [next, ...rows]
  }

  const updated = [...rows]
  updated[index] = next
  return updated
}

export default ActivityPage

/* -------------------------------------------------------------------------- */
/*                               Stats Card                                   */
/* -------------------------------------------------------------------------- */

type StatsCardVariant = 'default' | 'running' | 'completed' | 'failed'

const statsCardStyles: Record<
  StatsCardVariant,
  { bg: string; icon: string; text: string; ring: string }
> = {
  default: {
    bg: 'from-primary/10 via-primary/5 to-transparent',
    icon: 'bg-primary/10 text-primary',
    text: 'text-foreground',
    ring: 'ring-primary/10'
  },
  running: {
    bg: 'from-amber-500/10 via-amber-500/5 to-transparent',
    icon: 'bg-amber-500/10 text-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500/20'
  },
  completed: {
    bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    icon: 'bg-emerald-500/10 text-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/20'
  },
  failed: {
    bg: 'from-red-500/10 via-red-500/5 to-transparent',
    icon: 'bg-red-500/10 text-red-500',
    text: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-500/20'
  }
}

function StatsCard({
  label,
  value,
  icon,
  variant = 'default',
  pulse = false
}: {
  label: string
  value: number
  icon: React.ReactNode
  variant?: StatsCardVariant
  pulse?: boolean
}) {
  const style = statsCardStyles[variant]

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 shadow-sm transition-all duration-300 hover:shadow-md',
        `bg-linear-to-br ${style.bg}`,
        `ring-1 ${style.ring}`
      )}
    >
      {pulse && (
        <div className='absolute inset-0 animate-pulse bg-linear-to-r from-transparent via-white/5 to-transparent' />
      )}
      <CardContent className='flex items-center gap-4 p-5'>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            style.icon
          )}
        >
          {icon}
        </div>
        <div>
          <p className='text-sm font-medium text-muted-foreground'>{label}</p>
          <p className={cn('text-3xl font-bold tracking-tight', style.text)}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
