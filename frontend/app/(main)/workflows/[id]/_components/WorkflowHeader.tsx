'use client'

import { ArrowLeft, Save, SquarePen, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WorkflowHeaderProps {
  workflowName: string
  workflowDescription?: string | null
  onBack: () => void
  onEdit: () => void
  onSave: () => void
  isSaving: boolean
  workflowId: string | null
  onExecute: () => void
  isExecuting: boolean
}

export function WorkflowHeader({
  workflowName,
  onBack,
  onEdit,
  onSave,
  isSaving,
  workflowId,
  onExecute,
  isExecuting
}: WorkflowHeaderProps) {
  return (
    <div className='w-full h-14 bg-sidebar z-10 flex items-center justify-between px-4'>
      <div className='flex items-center gap-2 min-w-0'>
        <Button
          variant='ghost'
          size='icon'
          onClick={onBack}
          className='h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent shrink-0'
        >
          <ArrowLeft className='size-3.5' />
        </Button>
        <div className='flex flex-col min-w-0 flex-1 gap-0.5 overflow-hidden'>
          <h1 className='text-sm font-semibold text-sidebar-foreground truncate block'>
            {workflowName || 'Untitled Workflow'}
          </h1>
        </div>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-foreground/70 hover:text-sidebar-foreground shrink-0'
          onClick={onEdit}
        >
          <SquarePen className='size-3.5' />
        </Button>
      </div>
      <div className='flex items-center gap-1.5 shrink-0'>
        <Button
          variant='outline'
          size='sm'
          className='gap-1.5 px-2 h-8 text-xs'
          onClick={onExecute}
          isLoading={isExecuting}
          disabled={isExecuting || !workflowId}
        >
          <Play className='h-3.5 w-3.5' />
          Execute
        </Button>
        <Button
          size='sm'
          className='gap-1.5 px-2 h-8 text-xs'
          onClick={onSave}
          isLoading={isSaving}
          disabled={isSaving || !workflowId}
        >
          <Save className='h-3.5 w-3.5' />
          Save
        </Button>
      </div>
    </div>
  )
}
