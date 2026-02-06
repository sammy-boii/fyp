'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Signal,
  Trash2,
  WifiOff,
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
        <header className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <div className='relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-inner'>
              <div className='absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_55%)]' />
              <Activity className='relative h-5 w-5 text-primary' />
            </div>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='text-2xl font-semibold leading-tight'>
                  Activity
                </h1>
                <Badge variant='secondary' className='text-xs'>
                  {totalExecutions} executions
                </Badge>
              </div>
              <p className='text-xs text-muted-foreground'>
                Track execution history and real-time workflow updates.
              </p>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {isConnected ? (
              <Badge
                variant='outline'
                className='text-emerald-600 border-emerald-500/50 gap-1.5'
              >
                <span className='relative flex size-2'>
                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60' />
                  <span className='relative inline-flex h-2 w-2 rounded-full bg-emerald-500' />
                </span>
                <Signal className='h-3 w-3' />
                Live ({connectedCount})
              </Badge>
            ) : (
              <Badge variant='outline' className='text-red-600 border-red-600'>
                <WifiOff className='h-3 w-3 mr-1' />
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
        </header>

        <div className='grid gap-3 md:grid-cols-3'>
          <Card className='border border-border/60 bg-muted/30 shadow-sm'>
            <CardContent className='flex items-center justify-between gap-3 p-4'>
              <div>
                <p className='text-xs text-muted-foreground'>Running</p>
                <p className='text-2xl font-semibold'>{runningCount}</p>
              </div>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10'>
                <Zap className='h-4 w-4 text-primary' />
              </div>
            </CardContent>
          </Card>
          <Card className='border border-border/60 bg-muted/30 shadow-sm'>
            <CardContent className='flex items-center justify-between gap-3 p-4'>
              <div>
                <p className='text-xs text-muted-foreground'>Completed</p>
                <p className='text-2xl font-semibold'>{completedCount}</p>
              </div>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15'>
                <CheckCircle2 className='h-4 w-4 text-emerald-500' />
              </div>
            </CardContent>
          </Card>
          <Card className='border border-border/60 bg-muted/30 shadow-sm'>
            <CardContent className='flex items-center justify-between gap-3 p-4'>
              <div>
                <p className='text-xs text-muted-foreground'>Failed</p>
                <p className='text-2xl font-semibold'>{failedCount}</p>
              </div>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10'>
                <BarChart3 className='h-4 w-4 text-destructive' />
              </div>
            </CardContent>
          </Card>
        </div>

        {activityQuery.isLoading ? (
          <div className='space-y-3'>
            <div className='rounded-xl border bg-card'>
              <div className='border-b px-6 py-4'>
                <Skeleton className='h-4 w-full' />
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-3 border-b px-4 py-4 last:border-b-0'
                >
                  <Skeleton className='h-4 w-4 rounded' />
                  <Skeleton className='h-4 w-40' />
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-28' />
                  <Skeleton className='h-4 w-24' />
                </div>
              ))}
            </div>
          </div>
        ) : activityQuery.isError || activityQuery.data?.error ? (
          <div className='flex min-h-[50vh] items-center justify-center'>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Activity className='h-6 w-6' />
                </EmptyMedia>
                <EmptyTitle>Unable to load activity</EmptyTitle>
                <EmptyDescription>
                  There was a problem fetching your execution history. Please
                  try again.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : rows.length === 0 ? (
          <div className='flex min-h-[50vh] items-center justify-center'>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Activity className='h-6 w-6' />
                </EmptyMedia>
                <EmptyTitle>No executions yet</EmptyTitle>
                <EmptyDescription>
                  Run a workflow to start building your activity history.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
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
