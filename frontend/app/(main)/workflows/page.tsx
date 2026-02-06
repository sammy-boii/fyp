'use client'

import { useState } from 'react'
import { Plus, Workflow } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { columns } from './columns'
import { DataTable } from './data-table'
import { useCreateWorkflow, useGetWorkflows } from '@/hooks/use-workflows'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function WorkflowsPage() {
  const { data, isLoading, isError } = useGetWorkflows()
  const createWorkflow = useCreateWorkflow()

  const workflows = data?.data || []

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState('')
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('')

  return (
    <div className='w-full bg-background'>
      <div className='mx-auto flex flex-col gap-6 p-8'>
        <header className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary/15 via-primary/10 to-primary/5 ring-1 ring-primary/10'>
              <Workflow className='h-5 w-5 text-primary' />
            </div>
            <div>
              <h1 className='text-2xl font-semibold leading-tight'>
                Workflows
              </h1>
              <p className='text-xs text-muted-foreground'>
                Create and manage your automation workflows.
              </p>
            </div>
          </div>
          <Button
            className='gap-2'
            onClick={() => {
              setNewWorkflowName('')
              setNewWorkflowDescription('')
              setCreateDialogOpen(true)
            }}
          >
            <Plus className='h-4 w-4' />
            Add workflow
          </Button>
        </header>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-3'>
                <div className='bg-muted/60 rounded-md p-2'>
                  <Workflow className='size-5' />
                </div>
                Add workflow
              </DialogTitle>
              <DialogDescription>
                Give your workflow a name and description. You can configure its
                steps on the next screen.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='new-workflow-name'>Name</Label>
                <Input
                  id='new-workflow-name'
                  placeholder='My workflow'
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      newWorkflowName.trim() &&
                      !createWorkflow.isPending
                    ) {
                      handleCreate()
                    }
                  }}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='new-workflow-description'>Description</Label>
                <Textarea
                  id='new-workflow-description'
                  placeholder='Describe what this workflow does'
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setCreateDialogOpen(false)
                  setNewWorkflowName('')
                  setNewWorkflowDescription('')
                }}
                disabled={createWorkflow.isPending}
              >
                Cancel
              </Button>
              <Button
                isLoading={createWorkflow.isPending}
                className='w-18'
                onClick={handleCreate}
                disabled={!newWorkflowName.trim() || createWorkflow.isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className='space-y-3'>
            <div className='rounded-lg border'>
              <div className='border-b px-6 py-4'>
                <Skeleton className='h-4 w-full' />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-3 border-b px-4 py-4 last:border-b-0'
                >
                  <Skeleton className='h-10 w-10 rounded-lg shrink-0' />
                  <div className='flex flex-col flex-1 gap-0.5 min-w-0'>
                    <Skeleton className='h-4 w-1/3' />
                    <Skeleton className='h-3 w-1/2' />
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <Skeleton className='h-4 w-4 rounded' />
                    <Skeleton className='h-4 w-6' />
                  </div>
                  <Skeleton className='h-6 w-20 rounded-full shrink-0' />
                  <div className='flex items-center gap-2 shrink-0'>
                    <Skeleton className='h-4 w-4 rounded' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <Skeleton className='h-4 w-4 rounded' />
                    <Skeleton className='h-4 w-16' />
                  </div>
                  <div className='flex gap-2 shrink-0'>
                    <Skeleton className='h-8 w-8 rounded-md' />
                    <Skeleton className='h-8 w-8 rounded-md' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isError || data?.error ? (
          <div className='flex min-h-[60vh] items-center justify-center'>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Workflow className='h-6 w-6' />
                </EmptyMedia>
                <EmptyTitle>Unable to load workflows</EmptyTitle>
                <EmptyDescription>
                  There was a problem fetching your workflows. Please try
                  refreshing the page.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : workflows.length === 0 ? (
          <div className='flex min-h-[60vh] items-center justify-center'>
            <Empty className='border-none'>
              <EmptyHeader>
                <EmptyMedia>
                  <Workflow className='size-8 text-muted-foreground' />
                </EmptyMedia>
                <EmptyTitle className='text-xl tracking-normal'>
                  No Workflows Found
                </EmptyTitle>
                <EmptyDescription className='max-w-sm'>
                  Create and configure your first workflow and view their
                  listing here
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <DataTable columns={columns} data={workflows} />
        )}
      </div>
    </div>
  )
  function handleCreate() {
    const name = newWorkflowName.trim()
    if (!name) return

    const payload = {
      name,
      description: newWorkflowDescription.trim() ?? '',
      nodes: [],
      edges: []
    }

    createWorkflow.mutate(payload, {
      onSuccess: (result) => {
        if (result?.data && result?.data?.id) {
          setCreateDialogOpen(false)
          setNewWorkflowName('')
          setNewWorkflowDescription('')
          window.location.href = `/workflows/${result.data.id}`
        }
      }
    })
  }
}
