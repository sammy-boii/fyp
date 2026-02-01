'use client'

import { Button } from '@/components/ui/button'
import { SheetContent, Sheet, SheetHeader } from '@/components/ui/sheet'
import {
  NodeAction,
  SingleNodeDefinition,
  SingleTriggerNodeDefinition
} from '@/types/node.types'
import { ChevronRight, Settings } from 'lucide-react'
import React, { useState } from 'react'
import NodeConfigurationDialog from './NodeConfigurationDialog'
import { NodeInputSource, NodeOutputData } from '@/lib/node-execution-store'

export const NodeActionsSheet = ({
  node,
  nodeId,
  onSaveConfig,
  preSelectedAction,
  initialConfig,
  open,
  onOpenChange,
  availableInputs = [],
  nodeOutput
}: {
  node: SingleNodeDefinition | SingleTriggerNodeDefinition
  nodeId: string
  onSaveConfig?: (data: any) => void
  preSelectedAction?: NodeAction
  initialConfig?: any
  open?: boolean
  onOpenChange?: (open: boolean) => void
  availableInputs?: NodeInputSource[]
  nodeOutput?: NodeOutputData
}) => {
  const [openActionsSheet, setOpenActionsSheet] = useState(false)
  const [selectedAction, setSelectedAction] = useState<NodeAction | null>(
    preSelectedAction || null
  )

  const [openConfigDialog, setOpenConfigDialog] = useState(false)

  const handleActionSelect = (action: NodeAction) => {
    setSelectedAction(action)

    setOpenActionsSheet(false)
    setOpenConfigDialog(true)
  }

  const handleSettingsClick = () => {
    if (preSelectedAction) {
      // If node already has configuration, open config dialog directly without showing action sheet
      setSelectedAction(preSelectedAction)
      setOpenConfigDialog(true)
    } else {
      // Otherwise, show the actions sheet
      setOpenActionsSheet(true)
    }
  }

  // Sync external open state with internal state
  React.useEffect(() => {
    if (open !== undefined) {
      if (preSelectedAction) {
        setSelectedAction(preSelectedAction)
        setOpenConfigDialog(open)
      } else {
        setOpenActionsSheet(open)
      }
    }
  }, [open, preSelectedAction])

  const handleConfigDialogChange = (isOpen: boolean) => {
    setOpenConfigDialog(isOpen)
    onOpenChange?.(isOpen)
  }

  return (
    <>
      {/* Configuration Dialog - shown when action is selected or already configured */}
      {selectedAction && (
        <NodeConfigurationDialog
          isOpen={openConfigDialog}
          setIsOpen={handleConfigDialogChange}
          action={selectedAction}
          nodeId={nodeId}
          onSaveConfig={onSaveConfig}
          initialConfig={initialConfig}
          availableInputs={availableInputs}
          nodeOutput={nodeOutput}
        />
      )}

      {/* Action Selection Sheet - Controlled via state */}
      <Sheet open={openActionsSheet} onOpenChange={setOpenActionsSheet}>
        <SheetContent className='p-2 flex flex-col'>
          <SheetHeader>
            <div>
              <h3 className='text-lg font-medium mb-1'>Select Action</h3>
              <p className='text-sm text-muted-foreground'>
                Choose what you want to do with {node.label}
              </p>
            </div>
          </SheetHeader>

          <div className='space-y-3 px-2 overflow-y-auto flex-1'>
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

      {/* Settings Button - Triggers either Sheet or Config Dialog */}
      <Button
        size='icon'
        variant='outline'
        className='h-6 w-6 bg-background/95 backdrop-blur-sm border-border/50 shadow-sm hover:bg-primary/10 hover:border-primary/60 hover:text-primary hover:shadow-md transition-all'
        onClick={handleSettingsClick}
      >
        <Settings className='h-3 w-3' />
      </Button>
    </>
  )
}
