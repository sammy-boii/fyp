'use client'

import { ArrowLeft, Save, SquarePen, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useWorkflowEditor } from '../_context/WorkflowEditorContext'

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
  isActive: boolean
  onToggleActive: (active: boolean) => void
  isTogglingActive: boolean
  isWorkflowEmpty: boolean
  isManualTrigger: boolean
}

export function WorkflowHeader({
  workflowName,
  onBack,
  onEdit,
  onSave,
  isSaving,
  workflowId,
  onExecute,
  isExecuting,
  isActive,
  onToggleActive,
  isWorkflowEmpty,
  isManualTrigger
}: WorkflowHeaderProps) {
  const { isAnyOperationPending } = useWorkflowEditor()

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
      <div className='flex items-center gap-3 shrink-0'>
        <div className='flex items-center mr-4 gap-2'>
          <span className='text-xs font-medium text-muted-foreground'>
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <Switch
            checked={isActive}
            onCheckedChange={onToggleActive}
            disabled={isAnyOperationPending || !workflowId}
          />
        </div>
        <Button
          variant='outline'
          size='sm'
          className='gap-1.5 px-2 w-24 h-8 text-xs'
          onClick={onExecute}
          isLoading={isExecuting}
          disabled={
            isAnyOperationPending ||
            !workflowId ||
            isWorkflowEmpty ||
            !isManualTrigger
          }
        >
          <Play className='h-3.5 w-3.5' />
          Execute
        </Button>
        <Button
          size='sm'
          className='gap-1.5 w-20 px-2 h-8 text-xs text-white'
          onClick={onSave}
          isLoading={isSaving}
          disabled={isAnyOperationPending || !workflowId}
        >
          <Save className='h-3.5 w-3.5' />
          Save
        </Button>
      </div>
    </div>
  )
}
