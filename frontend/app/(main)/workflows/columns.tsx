'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ColumnDef } from '@tanstack/react-table'
import {
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  GitBranch,
  MoreHorizontal,
  Pause,
  Play,
  PlayCircle,
  Trash2,
  Workflow
} from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { WorkflowStatus } from '@shared/prisma/generated/prisma/enums'

export type WorkflowRow = {
  id: string
  name: string
  lastExecutedAt: string | null
  nodeCount: number
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<
  WorkflowRow['status'],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  [WorkflowStatus.ACTIVE]: {
    label: WorkflowStatus.ACTIVE,
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
  },
  [WorkflowStatus.INACTIVE]: {
    label: WorkflowStatus.INACTIVE,
    icon: Pause,
    className: 'bg-destructive/10 text-destructive'
  },
  [WorkflowStatus.PAUSED]: {
    label: WorkflowStatus.PAUSED,
    icon: Clock,
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-200'
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return 'Never'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export const columns: ColumnDef<WorkflowRow>[] = [
  {
    accessorKey: 'name',
    header: 'Workflow',
    cell: ({ row }) => {
      const workflow = row.original
      return (
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
            <Workflow className='h-5 w-5 text-primary' />
          </div>
          <div className='flex flex-col'>
            <span className='text-sm font-semibold'>{workflow.name}</span>
            <span className='text-xs text-muted-foreground'>
              ID: {workflow.id}
            </span>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: 'nodeCount',
    header: 'Nodes',
    cell: ({ getValue }) => {
      const count = getValue() as number
      return (
        <div className='flex items-center gap-2 text-sm'>
          <GitBranch className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium'>{count}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue() as WorkflowRow['status']
      const config = statusConfig[status]
      console.log('status', status)
      console.log('config', config)
      const Icon = config.icon
      return (
        <Badge className={config.className} variant='outline'>
          <Icon className='h-3 w-3 mr-1.5' />
          {config.label}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'lastExecutedAt',
    header: 'Last Executed',
    cell: ({ getValue }) => {
      const lastExecuted = getValue() as string | null
      return (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <PlayCircle className='h-4 w-4' />
          <span>{formatDate(lastExecuted)}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Modified',
    cell: ({ getValue }) => {
      const updatedAt = getValue() as string
      return (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Edit className='h-4 w-4' />
          <span>{formatDate(updatedAt)}</span>
        </div>
      )
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ActionCell workflow={row.original} />
  }
]

function ActionCell({ workflow }: { workflow: WorkflowRow }) {
  return (
    <TooltipProvider delayDuration={50}>
      <div className='flex items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8' asChild>
              <Link href={`/workflow/${workflow.id}`}>
                <ExternalLink className='h-4 w-4' />
                <span className='sr-only'>Open workflow</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open workflow</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8'>
              <MoreHorizontal className='h-4 w-4' />
              <span className='sr-only'>More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {workflow.status === WorkflowStatus.ACTIVE ? (
              <DropdownMenuItem className='hover:bg-amber-500/10 focus:bg-amber-500/10 text-amber-500 hover:text-amber-500!'>
                <Pause className='mr-1 text-amber-500 h-4 w-4' />
                Pause
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className='hover:bg-green-500/10 focus:bg-green-500/10 text-green-500 hover:text-green-500!'>
                <Play className='text-green-500 mr-1 bg-green-500/10 h-4 w-4' />
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='text-destructive hover:bg-destructive/10 focus:bg-destructive/10 hover:text-destructive!'>
              <Trash2 className='mr-1 text-destructive h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  )
}
