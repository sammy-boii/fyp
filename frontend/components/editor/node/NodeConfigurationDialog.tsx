'use client'

import { NodeAction } from '@/types/node.types'
import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import NodeInputDialog from './NodeInputDialog'
import NodeOutputDialog from './NodeOutputDialog'

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable'
import { ArchiveRestore } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BaseConfigurationForm } from './BaseConfigurationForm'
import { NodeInputSource, NodeOutputData } from '@/lib/node-execution-store'
import { cn } from '@/lib/utils'
import { PlaceholderProvider } from '@/components/ui/placeholder-input'
import {
  NODE_DEFINITIONS,
  TRIGGER_NODE_DEFINITIONS
} from '@/constants/registry'
import { NODE_TYPES, TRIGGER_NODE_TYPES } from '@/constants'

const NodeConfigurationDialog = ({
  action: action,
  isOpen,
  setIsOpen,
  nodeId,
  onSaveConfig,
  initialConfig,
  availableInputs = [],
  nodeOutput,
  nodeColor
}: {
  action: NodeAction
  isOpen: boolean
  setIsOpen: React.Dispatch<boolean>
  nodeId?: string
  onSaveConfig?: (data: any) => void
  initialConfig?: any
  availableInputs?: NodeInputSource[]
  nodeOutput?: NodeOutputData
  nodeColor?: string
}) => {
  const headerIconWrapperStyle = nodeColor
    ? { backgroundColor: `${nodeColor}1a` }
    : undefined
  const headerIconStyle = nodeColor ? { color: nodeColor } : undefined

  // Build nodeId → display label map for placeholder chips
  const nodeMap = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const input of availableInputs) {
      const isTrigger = Object.values(TRIGGER_NODE_TYPES).includes(
        input.nodeType as (typeof TRIGGER_NODE_TYPES)[keyof typeof TRIGGER_NODE_TYPES]
      )
      const nodeDef = isTrigger
        ? TRIGGER_NODE_DEFINITIONS[
            input.nodeType as keyof typeof TRIGGER_NODE_TYPES
          ]
        : NODE_DEFINITIONS[input.nodeType as keyof typeof NODE_TYPES]
      map.set(input.nodeId, nodeDef?.label || input.nodeType)
    }
    return map
  }, [availableInputs])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTitle className='sr-only'>Node Configuration</DialogTitle>
      <DialogContent className='min-w-[90vw] w-full h-[90vh] p-0'>
        <PlaceholderProvider nodeMap={nodeMap}>
          <ResizablePanelGroup direction='horizontal' className='h-full'>
            {/* Input Panel */}
            <ResizablePanel minSize={20}>
              <Card className='h-full rounded-none border-r border-b-0 border-l-0 border-t-0'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                    <div
                      className={cn('rounded p-1', !nodeColor && 'bg-muted')}
                      style={headerIconWrapperStyle}
                    >
                      <ArchiveRestore
                        className={cn(
                          'h-4 w-4 rotate-180',
                          !nodeColor && 'text-primary'
                        )}
                        style={headerIconStyle}
                      />
                    </div>
                    Input Configuration
                  </CardTitle>
                  <Separator />
                </CardHeader>
                <CardContent className='p-4 pt-0'>
                  <NodeInputDialog availableInputs={availableInputs} />
                </CardContent>
              </Card>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Form Panel */}
            <ResizablePanel minSize={20}>
              <BaseConfigurationForm
                {...action}
                nodeId={nodeId}
                onSaveConfig={onSaveConfig}
                onClose={() => setIsOpen(false)}
                initialConfig={initialConfig}
                nodeColor={nodeColor}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Output Panel */}
            <ResizablePanel minSize={20}>
              <Card className='h-full rounded-none border-b-0 border-l-0 border-r-0 border-t-0'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                    <div
                      className={cn('rounded p-1', !nodeColor && 'bg-muted')}
                      style={headerIconWrapperStyle}
                    >
                      <ArchiveRestore
                        className={cn('h-4 w-4', !nodeColor && 'text-primary')}
                        style={headerIconStyle}
                      />
                    </div>
                    Output Preview
                  </CardTitle>
                  <Separator />
                </CardHeader>
                <CardContent className='p-4 pt-0'>
                  <NodeOutputDialog output={nodeOutput} />
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </PlaceholderProvider>
      </DialogContent>
    </Dialog>
  )
}

export default NodeConfigurationDialog
