'use client'

import { NodeAction } from '@/types/node.types'
import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import NodeInputDialog from './NodeInputDialog'
import NodeOutputDialog from './NodeOutputDialog'
import z from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText
} from '@/components/ui/input-group'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable'
import { ArrowDown, ArrowUp, Settings, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { BaseConfigurationForm } from './BaseConfigurationForm'

const NodeConfigurationDialog = ({
  action: action,
  isOpen,
  setIsOpen
}: {
  action: NodeAction
  isOpen: boolean
  setIsOpen: React.Dispatch<boolean>
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
                    <ArrowDown className='h-4 w-4 text-primary bg-muted rounded' />
                  </div>
                  Input Configuration
                </CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className='p-4 pt-0'>
                <NodeInputDialog />
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Form Panel */}
          <ResizablePanel minSize={20}>
            <Card className='h-full rounded-none border-r border-b-0 border-l-0 border-t-0'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                  <div className='bg-muted rounded p-1'>
                    <Settings className='h-4 w-4 text-primary' />
                  </div>
                  Node Settings
                </CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className='p-4 pt-0'>
                <BaseConfigurationForm {...action} />
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Output Panel */}
          <ResizablePanel minSize={20}>
            <Card className='h-full rounded-none border-b-0 border-l-0 border-r-0 border-t-0'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                  <div className='bg-muted rounded p-1'>
                    <ArrowUp className='h-4 w-4 text-primary' />
                  </div>
                  Output Preview
                </CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className='p-4 pt-0'>
                <NodeOutputDialog />
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DialogContent>
    </Dialog>
  )
}

export default NodeConfigurationDialog
