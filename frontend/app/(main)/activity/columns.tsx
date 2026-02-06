'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ActivityExecutionRow } from './types'

const statusStyles: Record<
  ActivityExecutionRow['status'],
  { label: string; className: string }
> = {
  RUNNING: {
    label: 'Running',
    className: 'border-yellow-500 text-yellow-600'
  },
  COMPLETED: {
    label: 'Completed',
    className: 'border-emerald-500 text-emerald-600'
  },
  FAILED: {
    label: 'Failed',
    className: 'border-destructive text-destructive'
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'border-muted-foreground text-muted-foreground'
  }
}

const triggerLabels: Record<ActivityExecutionRow['triggerType'], string> = {
  MANUAL: 'Manual',
  SCHEDULED: 'Scheduled',
  WEBHOOK: 'Webhook',
  UNKNOWN: 'Unknown'
}

const eventLabels: Record<string, string> = {
  'workflow:start': 'Workflow started',
  'node:start': 'Node started',
  'node:complete': 'Node completed',
  'node:error': 'Node failed',
  'workflow:complete': 'Workflow completed',
  'workflow:error': 'Workflow failed'
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (value?: number | null) => {
  if (value === null || value === undefined) return '—'
  const seconds = value / 1000
  return `${seconds.toFixed(2).replace(/\.00$/, '')}s`
}

const multiValueFilter = (
  row: any,
  columnId: string,
  filterValue: string[]
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true
  return filterValue.includes(row.getValue(columnId))
}

export const columns: ColumnDef<ActivityExecutionRow>[] = [
  {
    accessorKey: 'workflowName',
    header: 'Workflow',
    cell: ({ row }) => (
      <div className='max-w-[220px] truncate font-medium'>
        {row.getValue('workflowName')}
      </div>
    )
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: multiValueFilter,
    cell: ({ row }) => {
      const status = row.getValue('status') as ActivityExecutionRow['status']
      const style = statusStyles[status]
      return (
        <Badge variant='outline' className={cn('text-xs', style.className)}>
          {style.label}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'triggerType',
    header: 'Trigger',
    filterFn: multiValueFilter,
    cell: ({ row }) => (
      <Badge variant='secondary' className='text-xs capitalize'>
        {triggerLabels[row.getValue('triggerType') as ActivityExecutionRow['triggerType']]}
      </Badge>
    )
  },
  {
    accessorKey: 'nodeCount',
    header: 'Steps',
    cell: ({ row }) => {
      const count = row.getValue('nodeCount') as number
      const progress = row.original.progress
      if (progress?.total) {
        return (
          <span className='font-mono text-xs'>
            {progress.current}/{progress.total}
          </span>
        )
      }
      return <span className='font-mono text-xs'>{count || 0}</span>
    }
  },
  {
    accessorKey: 'durationMs',
    header: 'Duration',
    cell: ({ row }) => (
      <span className='text-xs text-muted-foreground'>
        {formatDuration(row.getValue('durationMs') as number | null)}
      </span>
    )
  },
  {
    accessorKey: 'createdAt',
    header: 'Started',
    cell: ({ row }) => (
      <span className='text-xs'>{formatDateTime(row.getValue('createdAt'))}</span>
    )
  },
  {
    accessorKey: 'completedAt',
    header: 'Completed',
    cell: ({ row }) => (
      <span className='text-xs'>{formatDateTime(row.getValue('completedAt'))}</span>
    )
  },
  {
    accessorKey: 'lastEventType',
    header: 'Last Event',
    cell: ({ row }) => {
      const value = row.getValue('lastEventType') as string | undefined
      return (
        <span className='text-xs text-muted-foreground'>
          {value ? eventLabels[value] ?? value : '—'}
        </span>
      )
    }
  },
  {
    accessorKey: 'error',
    header: 'Error',
    cell: ({ row }) => {
      const value = row.getValue('error') as string | null
      if (!value) return <span className='text-xs text-muted-foreground'>—</span>
      return (
        <span className='max-w-[220px] truncate text-xs text-destructive'>
          {value}
        </span>
      )
    }
  },
  {
    accessorKey: 'executionId',
    header: 'Execution',
    cell: ({ row }) => (
      <span className='font-mono text-xs' title={row.getValue('executionId')}>
        {String(row.getValue('executionId')).slice(0, 10)}
      </span>
    )
  }
]
