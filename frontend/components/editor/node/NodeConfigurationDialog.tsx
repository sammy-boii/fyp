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

const NodeConfigurationDialog = ({
  action: action,
  isOpen,
  setIsOpen,
  nodeId,
  onSaveConfig,
  initialConfig,
  availableInputs = [],
  nodeOutput
}: {
  action: NodeAction
  isOpen: boolean
  setIsOpen: React.Dispatch<boolean>
  nodeId?: string
  onSaveConfig?: (data: any) => void
  initialConfig?: any
  availableInputs?: NodeInputSource[]
  nodeOutput?: NodeOutputData
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTitle className='sr-only'>Node Configuration</DialogTitle>
      <DialogContent className='min-w-[90vw] w-full h-[90vh] p-0'>
        <ResizablePanelGroup direction='horizontal' className='h-full'>
          {/* Input Panel */}
          <ResizablePanel minSize={20}>
            <Card className='h-full rounded-none border-r border-b-0 border-l-0 border-t-0'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                  <div className='bg-muted rounded p-1'>
                    <ArchiveRestore className='h-4 rotate-180 w-4 text-primary bg-muted rounded' />
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
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Output Panel */}
          <ResizablePanel minSize={20}>
            <Card className='h-full rounded-none border-b-0 border-l-0 border-r-0 border-t-0'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                  <div className='bg-muted rounded p-1'>
                    <ArchiveRestore className='h-4 w-4 text-primary' />
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
      </DialogContent>
    </Dialog>
  )
}

export default NodeConfigurationDialog
