'use client'

import { Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useState, useEffect } from 'react'
import { useUpdateWorkflow } from '@/hooks/use-workflows'
import { toast } from 'sonner'

interface EditWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowName: string
  workflowDescription: string | null
  workflowId: string | null
  onNameChange?: (name: string) => void
  onDescriptionChange?: (description: string) => void
}

export function EditWorkflowDialog({
  open,
  onOpenChange,
  workflowName,
  workflowDescription,
  workflowId,
  onNameChange,
  onDescriptionChange
}: EditWorkflowDialogProps) {
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const updateWorkflow = useUpdateWorkflow()

  // Sync state when dialog opens
  useEffect(() => {
    if (open) {
      setEditName(workflowName || '')
      setEditDescription(workflowDescription || '')
    }
  }, [open, workflowName, workflowDescription])

  const handleUpdateDetails = () => {
    if (!workflowId || !editName.trim()) return

    const name = editName.trim()
    const description = editDescription.trim()

    updateWorkflow.mutate(
      {
        id: workflowId,
        data: {
          name,
          description: description || null
        }
      },
      {
        onSuccess: () => {
          toast.success('Workflow details updated')
          // Update parent state with new values
          onNameChange?.(name)
          onDescriptionChange?.(description || '')
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to update workflow')
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3'>
            <div className='bg-muted/60 rounded-md p-2'>
              <Edit2 className='size-5' />
            </div>
            Edit workflow
          </DialogTitle>
          <DialogDescription>
            Change the name or description of your workflow.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-workflow-name'>Workflow Name</Label>
              <Input
                id='edit-workflow-name'
                placeholder='My Awesome Workflow'
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editName.trim() && workflowId) {
                    handleUpdateDetails()
                  }
                }}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-workflow-description'>Description</Label>
              <Textarea
                className='max-w-[460px]'
                id='edit-workflow-description'
                placeholder='Describe what this workflow does'
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={updateWorkflow.isPending}
          >
            Cancel
          </Button>
          <Button
            className='min-w-16'
            onClick={handleUpdateDetails}
            disabled={
              updateWorkflow.isPending || !editName.trim() || !workflowId
            }
            isLoading={updateWorkflow.isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
