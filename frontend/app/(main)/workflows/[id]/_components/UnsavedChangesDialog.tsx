'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface UnsavedChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeaveWithoutSaving: () => void
  onSaveAndLeave: () => void
  isSavingAndLeaving: boolean
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onLeaveWithoutSaving,
  onSaveAndLeave,
  isSavingAndLeaving
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave with unsaved changes?</DialogTitle>
          <DialogDescription>
            You have unsaved changes in this workflow. If you leave now, those
            edits will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='destructive' onClick={onLeaveWithoutSaving}>
            Leave without saving
          </Button>
          <Button onClick={onSaveAndLeave} isLoading={isSavingAndLeaving}>
            Save and leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
