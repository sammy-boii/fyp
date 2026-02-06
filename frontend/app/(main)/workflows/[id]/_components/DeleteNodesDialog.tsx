'use client'

import { Trash2 } from 'lucide-react'
import type { Node } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface DeleteNodesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedNodes: Node[]
  onConfirm: () => void
}

export function DeleteNodesDialog({
  open,
  onOpenChange,
  selectedNodes,
  onConfirm
}: DeleteNodesDialogProps) {
  const deletableNodes = selectedNodes.filter((n) => n.type !== 'trigger_node')
  const count = deletableNodes.length
  const isPlural = count > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className='p-2 rounded-md bg-destructive/20'>
              <Trash2 className='size-5 text-destructive' />
            </div>
            Delete {count} Node{isPlural ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            {isPlural ? 'these nodes' : 'this node'}? This action cannot be
            undone and will remove all connections to{' '}
            {isPlural ? 'these nodes' : 'this node'}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
