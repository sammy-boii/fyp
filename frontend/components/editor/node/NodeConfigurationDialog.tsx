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

const NodeConfigurationDialog = ({
  action: _action, // eslint-disable-line @typescript-eslint/no-unused-vars
  isOpen,
  setIsOpen
}: {
  action: NodeAction
  isOpen: boolean
  setIsOpen: React.Dispatch<boolean>
}) => {
  const formSchema = z.object({
    title: z
      .string()
      .min(5, 'Bug title must be at least 5 characters.')
      .max(32, 'Bug title must be at most 32 characters.'),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters.')
      .max(100, 'Description must be at most 100 characters.')
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: ''
    }
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast('You submitted the following values:', {
      description: (
        <pre className='bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4'>
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
      position: 'bottom-right',
      classNames: {
        content: 'flex flex-col gap-2'
      },
      style: {
        '--border-radius': 'calc(var(--radius)  + 4px)'
      } as React.CSSProperties
    })
  }

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
                  <ArrowDown className='h-4 w-4 text-blue-500' />
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
                  <Settings className='h-4 w-4 text-green-500' />
                  Node Settings
                </CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className='p-4 pt-0'>
                <form
                  className='config-form h-full'
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FieldGroup className='space-y-6'>
                    <Controller
                      name='title'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel
                            htmlFor='title'
                            className='text-sm font-medium'
                          >
                            Node Title
                          </FieldLabel>
                          <Input
                            {...field}
                            id='title'
                            aria-invalid={fieldState.invalid}
                            placeholder='Enter a descriptive title for this node'
                            autoComplete='off'
                            className='mt-1'
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name='description'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel
                            htmlFor='description'
                            className='text-sm font-medium'
                          >
                            Description
                          </FieldLabel>
                          <InputGroup className='mt-1'>
                            <InputGroupTextarea
                              {...field}
                              id='description'
                              placeholder='Describe what this node does and any important details...'
                              rows={6}
                              className='min-h-24 resize-none'
                              aria-invalid={fieldState.invalid}
                            />
                            <InputGroupAddon align='block-end'>
                              <InputGroupText className='tabular-nums text-xs text-muted-foreground'>
                                {field.value.length}/100 characters
                              </InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                          <FieldDescription className='mt-1 text-xs text-muted-foreground'>
                            Provide a clear description of this node&apos;s
                            purpose and functionality.
                          </FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <div className='mt-6 pt-4 border-t'>
                    <Button type='submit' className='w-full'>
                      <Save className='h-4 w-4 mr-2' />
                      Save Configuration
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Output Panel */}
          <ResizablePanel minSize={20}>
            <Card className='h-full rounded-none border-b-0 border-l-0 border-r-0 border-t-0'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                  <ArrowUp className='h-4 w-4 text-purple-500' />
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
