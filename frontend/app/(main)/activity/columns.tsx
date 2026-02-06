'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Hand,
  HelpCircle,
  Settings,
  Timer,
  Workflow,
  XCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ActivityExecutionRow } from './types'

const statusConfig: Record<
  ActivityExecutionRow['status'],
  {
    label: string
    icon: React.ReactNode
    className: string
    bgClass: string
  }
> = {
  RUNNING: {
    label: 'Running',
    icon: <Clock className='h-3 w-3' />,
    className: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/30'
  },
  COMPLETED: {
    label: 'Completed',
    icon: <CheckCircle2 className='h-3 w-3' />,
    className: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/30'
  },
  FAILED: {
    label: 'Failed',
    icon: <XCircle className='h-3 w-3' />,
    className: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-500/10 border-red-500/30'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <AlertTriangle className='h-3 w-3' />,
    className: 'text-muted-foreground',
    bgClass: 'bg-muted/50 border-muted-foreground/30'
  }
}

const triggerConfig: Record<
  ActivityExecutionRow['triggerType'],
  { label: string; icon: React.ReactNode; className: string }
> = {
  MANUAL: {
    label: 'Manual',
    icon: <Hand className='h-3 w-3' />,
    className:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  SCHEDULED: {
    label: 'Scheduled',
    icon: <Calendar className='h-3 w-3' />,
    className:
      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
  },
  WEBHOOK: {
    label: 'Webhook',
    icon: <Globe className='h-3 w-3' />,
    className:
      'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
  },
  UNKNOWN: {
    label: 'Unknown',
    icon: <HelpCircle className='h-3 w-3' />,
    className: 'bg-muted/50 text-muted-foreground border-muted-foreground/30'
  }
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

const formatRelativeTime = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return null
}

const formatDuration = (value?: number | null) => {
  if (value === null || value === undefined) return '—'
  const seconds = value / 1000
  if (seconds < 1) return `${value}ms`
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
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
    header: () => (
      <div className='flex items-center gap-2 font-semibold'>
        <Workflow className='h-4 w-4 text-muted-foreground' />
        Workflow
      </div>
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10'>
          <Workflow className='h-4 w-4 text-primary' />
        </div>
        <div className='min-w-0'>
          <p className='truncate font-medium leading-tight'>
            {row.getValue('workflowName')}
          </p>
          <p className='truncate text-xs text-muted-foreground'>
            {row.original.executionId.slice(0, 8)}...
          </p>
        </div>
      </div>
    )
  },
  {
    accessorKey: 'status',
    header: () => <span className='font-semibold'>Status</span>,
    filterFn: multiValueFilter,
    cell: ({ row }) => {
      const status = row.getValue('status') as ActivityExecutionRow['status']
      const config = statusConfig[status]
      return (
        <Badge
          variant='outline'
          className={cn(
            'gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
            config.className,
            config.bgClass
          )}
        >
          {config.icon}
          {config.label}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'triggerType',
    header: () => <span className='font-semibold'>Trigger</span>,
    filterFn: multiValueFilter,
    cell: ({ row }) => {
      const type = row.getValue(
        'triggerType'
      ) as ActivityExecutionRow['triggerType']
      const config = triggerConfig[type]
      return (
        <Badge
          variant='outline'
          className={cn(
            'gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            config.className
          )}
        >
          {config.icon}
          {config.label}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'durationMs',
    header: () => (
      <div className='flex items-center gap-2 font-semibold'>
        <Timer className='h-4 w-4 text-muted-foreground' />
        Duration
      </div>
    ),
    cell: ({ row }) => {
      const ms = row.getValue('durationMs') as number | null
      const status = row.original.status

      if (status === 'RUNNING') {
        return (
          <span className='inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400'>
            <span className='relative flex h-2 w-2'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/60' />
              <span className='relative inline-flex h-2 w-2 rounded-full bg-amber-500' />
            </span>
            Running
          </span>
        )
      }

      return (
        <span className='inline-flex items-center gap-1 text-sm tabular-nums text-muted-foreground'>
          <Clock className='h-3.5 w-3.5' />
          {formatDuration(ms)}
        </span>
      )
    }
  },
  {
    accessorKey: 'createdAt',
    header: () => (
      <div className='flex items-center gap-2 font-semibold'>
        <Calendar className='h-4 w-4 text-muted-foreground' />
        Started
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue('createdAt') as string
      const relative = formatRelativeTime(value)
      const absolute = formatDateTime(value)

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='flex flex-col'>
                <span className='text-sm'>{absolute}</span>
                {relative && (
                  <span className='text-xs text-muted-foreground'>
                    {relative}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{new Date(value).toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
  },
  {
    accessorKey: 'error',
    header: () => <span className='font-semibold'>Error</span>,
    cell: ({ row }) => {
      const value = row.getValue('error') as string | null
      if (!value)
        return <span className='text-sm text-muted-foreground'>—</span>

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='flex items-center gap-2 max-w-[180px]'>
                <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10'>
                  <AlertTriangle className='h-3.5 w-3.5 text-red-500' />
                </div>
                <span className='truncate text-sm text-red-600 dark:text-red-400'>
                  {value}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side='left' className='max-w-sm'>
              <p className='text-sm wrap-break-word'>{value}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    enableSorting: false,
    header: () => (
      <div className='flex items-center gap-2 font-semibold'>
        <Settings className='h-4 w-4 text-muted-foreground' />
        Actions
      </div>
    ),
    cell: ({ row }) => (
      <TooltipProvider delayDuration={50}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8' asChild>
              <a
                href={`/activity/${row.original.executionId}`}
                target='_blank'
                rel='noreferrer'
              >
                <ExternalLink className='h-4 w-4' />
                <span className='sr-only'>View execution</span>
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View execution</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
]
