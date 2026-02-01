'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ColumnDef } from '@tanstack/react-table'
import {
  Edit,
  ExternalLink,
  GitBranch,
  MoreHorizontal,
  Play,
  PlayCircle,
  Trash2,
  Workflow,
  AlertCircle
} from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import { useDeleteWorkflow, useUpdateWorkflow } from '@/hooks/use-workflows'

export type WorkflowRow = {
  id: string
  name: string
  description: string | null
  lastExecutedAt: Date | null
  nodes: any
  executionCount: number
  createdAt: Date
  updatedAt: Date
  isActive: boolean
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
        <div className='flex max-w-52 items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
            <Workflow className='h-5 w-5 text-primary' />
          </div>
          <div className='flex flex-col flex-1 gap-0.5 overflow-hidden'>
            <span className='text-sm font-semibold truncate block'>
              {workflow.name}
            </span>
            <span className='text-xs text-muted-foreground truncate block'>
              {workflow.description || 'No description'}
            </span>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: 'nodes',
    header: 'Nodes',
    cell: ({ row }) => {
      const workflow = row.original
      return (
        <div className='flex items-center gap-2 text-sm'>
          <GitBranch className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium'>{workflow.nodes.length}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'executionCount',
    header: 'Executions',
    cell: ({ getValue }) => {
      const count = getValue() as number
      return (
        <div className='flex items-center gap-2 text-sm'>
          <PlayCircle className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium'>{count}</span>
        </div>
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
  // {
  //   accessorKey: 'updatedAt',
  //   header: 'Last Modified',
  //   cell: ({ getValue }) => {
  //     const updatedAt = getValue() as string
  //     return (
  //       <div className='flex items-center gap-2 text-sm text-muted-foreground'>
  //         <Edit className='h-4 w-4' />
  //         <span>{formatDate(updatedAt)}</span>
  //       </div>
  //     )
  //   }
  // },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusCell workflow={row.original} />
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ActionCell workflow={row.original} />
  }
]

function StatusCell({ workflow }: { workflow: WorkflowRow }) {
  const [optimisticActive, setOptimisticActive] = useState(workflow.isActive)
  const updateWorkflowMutation = useUpdateWorkflow()

  const handleToggleActive = (active: boolean) => {
    setOptimisticActive(active) // Optimistic update
    updateWorkflowMutation.mutate(
      {
        id: workflow.id,
        data: { isActive: active }
      },
      {
        onError: () => {
          setOptimisticActive(workflow.isActive) // Revert on error
        }
      }
    )
  }

  return (
    <div className='flex items-center gap-2'>
      <Switch
        checked={optimisticActive}
        onCheckedChange={handleToggleActive}
      />
    </div>
  )
}

function ActionCell({ workflow }: { workflow: WorkflowRow }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const deleteWorkflowMutation = useDeleteWorkflow()

  const handleDelete = async () => {
    await deleteWorkflowMutation.mutateAsync(workflow.id)
    setDeleteDialogOpen(false)
  }

  return (
    <>
      <TooltipProvider delayDuration={50}>
        <div className='flex items-center gap-2'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8' asChild>
                <a href={`/workflows/${workflow.id}`}>
                  <ExternalLink className='h-4 w-4' />
                  <span className='sr-only'>Open workflow</span>
                </a>
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

              <DropdownMenuItem
                className='text-destructive hover:bg-destructive/10 focus:bg-destructive/10 hover:text-destructive!'
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className='mr-1 text-destructive h-4 w-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-destructive' />
              <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{workflow.name}</strong>?
              This action cannot be undone and all the related data will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteWorkflowMutation.isPending}>
              Cancel
            </AlertDialogCancel>

            <Button
              onClick={handleDelete}
              className='bg-destructive w-20 text-destructive-foreground hover:bg-destructive/90'
              isLoading={deleteWorkflowMutation.isPending}
              disabled={deleteWorkflowMutation.isPending}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
