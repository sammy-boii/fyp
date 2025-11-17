'use client'

import { Button } from '@/components/ui/button'
import {
  SheetTrigger,
  SheetContent,
  Sheet,
  SheetHeader
} from '@/components/ui/sheet'
import { NodeAction, SingleNodeDefinition } from '@/types/node.types'
import { ChevronRight, Settings } from 'lucide-react'
import React, { useState } from 'react'
import NodeConfigurationDialog from './NodeConfigurationDialog'

export const NodeActionsSheet = ({ node }: { node: SingleNodeDefinition }) => {
  const [openActionsSheet, setOpenActionsSheet] = useState(false)
  const [selectedAction, setSelectedAction] = useState<NodeAction | null>(null)

  const [openConfigDialog, setOpenConfigDialog] = useState(false)

  const handleActionSelect = (action: NodeAction) => {
    setSelectedAction(action)

    setOpenActionsSheet(false)
    setOpenConfigDialog(true)
  }

  return (
    <>
      {/* don't nest SHEET and DIALOG (config component) and they both have their own portal context */}

      {/* SHEET */}
      <Sheet open={openActionsSheet} onOpenChange={setOpenActionsSheet}>
        <SheetTrigger asChild>
          <Button
            size='sm'
            variant='outline'
            className='h-6 w-6 p-0 bg-background/90 backdrop-blur-sm border-border/60 hover:bg-accent'
            onClick={() => setOpenActionsSheet((prev) => !prev)}
          >
            <Settings className='h-3.5 w-3.5' />
          </Button>
        </SheetTrigger>

        <SheetContent className='p-2'>
          <SheetHeader>
            <div className='mt-4'>
              <h3 className='text-lg font-medium mb-1'>Select Action</h3>
              <p className='text-sm text-muted-foreground'>
                Choose what you want to do with {node.label}
              </p>
            </div>
          </SheetHeader>

          <div className='space-y-3 px-2'>
            {node.actions.map((action) => {
              const Icon = action.icon
              return (
                <div
                  key={action.id}
                  className='group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:bg-accent hover:shadow-md'
                  onClick={() => handleActionSelect(action)}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3 flex-1'>
                      <div className='p-1.5 rounded-md bg-primary/10 text-primary'>
                        <Icon className='size-5' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-medium text-sm text-foreground group-hover:text-accent-foreground'>
                          {action.label}
                        </h4>
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className='h-4 w-4 text-muted-foreground group-hover:text-accent-foreground' />
                  </div>
                </div>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      {selectedAction && (
        <NodeConfigurationDialog
          isOpen={openConfigDialog}
          setIsOpen={setOpenConfigDialog}
          action={selectedAction}
        />
      )}
    </>
  )
}
