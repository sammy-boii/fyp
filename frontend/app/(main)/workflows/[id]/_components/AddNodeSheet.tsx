'use client'

import { Plus, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { NODE_OPTIONS } from '@/constants'
import { ValueOf } from '@/types/index.types'
import { NODE_TYPES } from '@/constants'

interface AddNodeSheetProps {
  onOpenChange: (open: boolean) => void
  onAddNode: (nodeType: ValueOf<typeof NODE_TYPES>) => void
}

export function AddNodeSheetContent({
  onOpenChange,
  onAddNode
}: AddNodeSheetProps) {
  return (
    <SheetContent side='right' className='sm:max-w-md'>
      <SheetHeader>
        <SheetTitle className='text-lg font-semibold'>Select a Node</SheetTitle>
        <SheetDescription>
          Choose a node and configure it to perform various tasks
        </SheetDescription>
      </SheetHeader>
      <div className='grid gap-3 p-4 pt-2'>
        {NODE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              onAddNode(option.id)
              onOpenChange(false)
            }}
            className='flex cursor-pointer w-full items-center justify-between rounded-lg border bg-card p-3 text-left transition hover:bg-muted'
          >
            <div className='flex items-center gap-3'>
              <span className='relative h-12 w-12 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900'>
                <Image
                  src={option.icon}
                  alt={option.name}
                  fill
                  sizes='48px'
                  className='object-contain p-2'
                />
              </span>
              <div className='flex flex-col'>
                <span className='text-sm font-semibold'>{option.name}</span>
                <span className='text-xs text-muted-foreground'>
                  Connect and manage secure access
                </span>
              </div>
            </div>
            <ChevronRight className='h-4 w-4 text-muted-foreground group-hover:text-accent-foreground' />
          </button>
        ))}
      </div>
    </SheetContent>
  )
}
