'use client'

import { Plus } from 'lucide-react'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { AddNodeSheetContent } from '@/app/(main)/workflows/[id]/_components/AddNodeSheet'
import { ValueOf } from '@/types/index.types'
import { ALL_NODE_TYPES } from '@/constants'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface EmptyWorkflowPlaceholderProps {
  isAIGenerating: boolean
  onAddNode: (nodeType: ValueOf<typeof ALL_NODE_TYPES>) => void
}

export function EmptyWorkflowPlaceholder({
  onAddNode,
  isAIGenerating
}: EmptyWorkflowPlaceholderProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  console.log(isAIGenerating)

  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center pointer-events-none',
        isAIGenerating ? 'z-1' : 'z-10 '
      )}
    >
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <div className='flex w-24 gap-2 group flex-col justify-center'>
            <button
              className='
            p-6 rounded-lg border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-100
            group pointer-events-auto flex flex-col items-center justify-center gap-4 hover:border-primary/50 bg-background/50 hover:bg-primary/5 cursor-pointer'
              onClick={() => setSheetOpen(true)}
            >
              <div>
                <Plus className='size-12 text-muted-foreground/60 group-hover:text-primary transition-colors duration-300' />
              </div>
            </button>
            <div className='text-center space-y-1'>
              <p className='text-xs duration-100 font-medium text-muted-foreground/60 group-hover:text-foreground transition-colors'>
                Add a node
              </p>
            </div>
          </div>
        </SheetTrigger>

        <AddNodeSheetContent
          onOpenChange={setSheetOpen}
          onAddNode={onAddNode}
          showOnlyTriggers
        />
      </Sheet>
    </div>
  )
}
