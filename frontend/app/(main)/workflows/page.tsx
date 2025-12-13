'use client'

import { Plus, Workflow } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { columns, WorkflowRow } from './columns'
import { DataTable } from './data-table'

const dummyWorkflows: WorkflowRow[] = [
  {
    id: 1,
    name: 'Email to Drive Backup',
    lastExecutedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    nodeCount: 5,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
  },
  {
    id: 2,
    name: 'Slack Notifications',
    lastExecutedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    nodeCount: 3,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
  },
  {
    id: 3,
    name: 'Data Sync Workflow',
    lastExecutedAt: null, // Never executed
    nodeCount: 8,
    status: 'paused',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
  },
  {
    id: 4,
    name: 'Weekly Report Generator',
    lastExecutedAt: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 2
    ).toISOString(), // 2 days ago
    nodeCount: 6,
    status: 'inactive',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
  },
  {
    id: 5,
    name: 'Automated File Processor',
    lastExecutedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    nodeCount: 4,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 mins ago
  }
]

export default function WorkflowsPage() {
  return (
    <div className='w-full bg-background'>
      <div className='mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-10'>
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

        <DataTable columns={columns} data={dummyWorkflows} />
      </div>
    </div>
  )
}
