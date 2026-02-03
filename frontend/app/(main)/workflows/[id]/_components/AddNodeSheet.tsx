'use client'

import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  NODE_DEFINITIONS,
  TRIGGER_NODE_DEFINITIONS
} from '@/constants/registry'
import { ValueOf } from '@/types/index.types'
import { NODE_TYPES, TRIGGER_NODE_TYPES, ALL_NODE_TYPES } from '@/constants'

interface AddNodeSheetProps {
  onOpenChange: (open: boolean) => void
  onAddNode: (nodeType: ValueOf<typeof ALL_NODE_TYPES>) => void
  showOnlyTriggers?: boolean
  showOnlyActions?: boolean
}

export function AddNodeSheetContent({
  onOpenChange,
  onAddNode,
  showOnlyTriggers = false,
  showOnlyActions = false
}: AddNodeSheetProps) {
  // Determine which definitions to show
  const showTriggers =
    showOnlyTriggers || (!showOnlyActions && !showOnlyTriggers)
  const showActions = showOnlyActions || (!showOnlyActions && !showOnlyTriggers)

  return (
    <SheetContent side='right' className='sm:max-w-md'>
      <SheetHeader>
        <SheetTitle className='text-lg font-semibold'>
          {showOnlyTriggers
            ? 'Select a Trigger'
            : showOnlyActions
              ? 'Select an Action'
              : 'Select a Node'}
        </SheetTitle>
        <SheetDescription>
          {showOnlyTriggers
            ? 'Choose a trigger to start your workflow'
            : showOnlyActions
              ? 'Choose an action node to add to your workflow'
              : 'Choose a node and configure it to perform various tasks'}
        </SheetDescription>
      </SheetHeader>

      <div className='grid gap-3 p-4 pt-2'>
        {/* Trigger Nodes */}
        {showTriggers && (
          <>
            {!showOnlyTriggers && !showOnlyActions && (
              <div className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-1'>
                Triggers
              </div>
            )}
            {Object.entries(TRIGGER_NODE_DEFINITIONS).map(([id, option]) => (
              <button
                key={id}
                onClick={() => {
                  onAddNode(id as ValueOf<typeof TRIGGER_NODE_TYPES>)
                  onOpenChange(false)
                }}
                className='flex cursor-pointer w-full items-center justify-between rounded-lg border bg-card p-3 text-left transition hover:bg-muted'
              >
                <div className='flex items-center gap-3'>
                  <span className='relative h-12 w-12 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900 flex items-center justify-center'>
                    {option.icon ? (
                      <Image
                        src={option.icon}
                        alt={option.label}
                        fill
                        sizes='48px'
                        className='object-contain p-2'
                      />
                    ) : option.iconComponent ? (
                      <option.iconComponent className='size-6 text-foreground' />
                    ) : null}
                  </span>
                  <div className='flex flex-col'>
                    <span className='text-sm font-semibold'>
                      {option.label}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {option.description}
                    </span>
                  </div>
                </div>
                <ChevronRight className='h-4 w-4 text-muted-foreground group-hover:text-accent-foreground' />
              </button>
            ))}
          </>
        )}

        {/* Action Nodes */}
        {showActions && (
          <>
            {!showOnlyTriggers && !showOnlyActions && (
              <div className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-1'>
                Actions
              </div>
            )}
            {Object.entries(NODE_DEFINITIONS).map(([id, option]) => (
              <button
                key={id}
                onClick={() => {
                  onAddNode(id as ValueOf<typeof NODE_TYPES>)
                  onOpenChange(false)
                }}
                className='flex cursor-pointer w-full items-center justify-between rounded-lg border bg-card p-3 text-left transition hover:bg-muted'
              >
                <div className='flex items-center gap-3'>
                  <span className='relative h-12 w-12 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900 flex items-center justify-center'>
                    {option.icon ? (
                      <Image
                        src={option.icon}
                        alt={option.label}
                        fill
                        sizes='48px'
                        className='object-contain p-2'
                      />
                    ) : option.iconComponent ? (
                      <option.iconComponent className='size-6 text-foreground' />
                    ) : null}
                  </span>
                  <div className='flex flex-col'>
                    <span className='text-sm font-semibold'>
                      {option.label}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {option.description}
                    </span>
                  </div>
                </div>
                <ChevronRight className='h-4 w-4 text-muted-foreground group-hover:text-accent-foreground' />
              </button>
            ))}
          </>
        )}
      </div>
    </SheetContent>
  )
}
