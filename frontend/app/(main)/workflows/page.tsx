'use client'

import { Plus, Workflow } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { columns, WorkflowRow } from './columns'
import { DataTable } from './data-table'
import { useGetWorkflows } from '@/hooks/use-workflows'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'

export default function WorkflowsPage() {
  const { data, isLoading, isError } = useGetWorkflows()

  const workflows: WorkflowRow[] =
    data?.data?.map((w: any) => ({
      id: w.id,
      name: w.name,
      lastExecutedAt: w.lastExecutedAt,
      nodeCount: w.nodeCount,
      status: w.status,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt
    })) ?? []

  return (
    <div className='w-full bg-background'>
      <div className='mx-auto flex flex-col gap-6 p-8'>
        <header className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
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
          <Button className='gap-2' asChild>
            <Link href='/workflows/new'>
              <Plus className='h-4 w-4' />
              Add workflow
            </Link>
          </Button>
        </header>

        {isLoading ? (
          <div className='space-y-3'>
            <div className='rounded-lg border'>
              <div className='border-b px-6 py-4'>
                <Skeleton className='h-4 w-full' />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-4 border-b px-6 py-4 last:border-b-0'
                >
                  <Skeleton className='h-10 w-10 rounded-md' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-1/4' />
                    <Skeleton className='h-3 w-1/3' />
                  </div>
                  <Skeleton className='h-6 w-20 rounded-full' />
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-4 w-24' />
                  <div className='flex gap-2'>
                    <Skeleton className='h-8 w-8 rounded-md' />
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
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Workflow className='h-6 w-6' />
                </EmptyMedia>
                <EmptyTitle>No workflows yet</EmptyTitle>
                <EmptyDescription>
                  Create your first workflow to automate your tasks.
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
}
