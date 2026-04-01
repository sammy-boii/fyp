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
import { AlertTriangle } from 'lucide-react'

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
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-600'>
              <AlertTriangle className='h-4 w-4' />
            </span>
            Leave this workflow?
          </DialogTitle>
          <DialogDescription>
            You have draft edits that are not saved yet. Save before leaving to
            keep your latest workflow updates.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='gap-2'>
          <Button variant='destructive' onClick={onLeaveWithoutSaving}>
            Discard
          </Button>
          <Button
            className='min-w-20'
            onClick={onSaveAndLeave}
            isLoading={isSavingAndLeaving}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
