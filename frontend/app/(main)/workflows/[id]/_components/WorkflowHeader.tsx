'use client'

import { ArrowLeft, Save, SquarePen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WorkflowHeaderProps {
  workflowName: string
  onBack: () => void
  onEdit: () => void
  onSave: () => void
  isSaving: boolean
  workflowId: string | null
}

export function WorkflowHeader({
  workflowName,
  onBack,
  onEdit,
  onSave,
  isSaving,
  workflowId
}: WorkflowHeaderProps) {
  return (
    <div className='w-full h-16 border-b border-sidebar-border bg-sidebar z-10 flex items-center justify-between px-6'>
      <div className='flex items-center gap-3'>
        <Button
          variant='ghost'
          size='icon'
          onClick={onBack}
          className='mr-4 hover:bg-sidebar-accent'
        >
          <ArrowLeft className='size-4' />
        </Button>
        <h1 className='text-base font-semibold text-sidebar-foreground'>
          {workflowName || 'Untitled Workflow'}
        </h1>
        <Button
          variant='ghost'
          size='icon'
          className='size-7 text-foreground/70 hover:text-sidebar-foreground'
          onClick={onEdit}
        >
          <SquarePen className='size-4' />
        </Button>
      </div>
      <Button
        size='sm'
        className='gap-2 min-w-20 items-center'
        onClick={onSave}
        isLoading={isSaving}
        disabled={isSaving || !workflowId}
      >
        <Save className='h-4 w-4' />
        Save
      </Button>
    </div>
  )
}
