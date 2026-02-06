'use client'

import { Trash2 } from 'lucide-react'
import type { Node } from '@xyflow/react'

interface NodeContextMenuProps {
  position: { x: number; y: number }
  selectedNodes: Node[]
  onDelete: () => void
  onClose: () => void
}

export function NodeContextMenu({
  position,
  selectedNodes,
  onDelete,
  onClose
}: NodeContextMenuProps) {
  const deletableNodes = selectedNodes.filter((n) => n.type !== 'trigger_node')
  const count = deletableNodes.length

  if (count === 0) return null

  return (
    <div
      className='fixed z-50 min-w-40 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95'
      style={{ left: position.x, top: position.y }}
    >
      <button
        className='relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-destructive'
        onClick={() => {
          onDelete()
          onClose()
        }}
      >
        <Trash2 className='h-4 w-4 mr-2' />
        Delete {count} node{count > 1 ? 's' : ''}
      </button>
    </div>
  )
}
