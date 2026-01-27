'use client'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { NodeAction } from '@/types/node.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Loader2 } from 'lucide-react'
import { Controller, useForm, FormProvider } from 'react-hook-form'
import z from 'zod'
import { useGetCredentials } from '@/hooks/use-credentials'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CREDENTIALS_OPTIONS } from '@/constants'

function ProviderIcon({ provider }: { provider: string }) {
  const base = provider.toLowerCase()

  const meta = CREDENTIALS_OPTIONS.find((option) => option.id === base)

  console.log(meta, base)

  if (meta?.icon) {
    return (
      <div className='relative h-6 w-6 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900'>
        <Image
          src={meta.icon}
          alt={meta.name}
          fill
          sizes='24px'
          className='object-contain p-1'
        />
      </div>
    )
  }

  return (
    <div className='flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-semibold uppercase'>
      {provider.slice(0, 2)}
    </div>
  )
}

export const BaseConfigurationForm = ({
  id,
  label,
  icon: ActionIcon,
  configForm,
  requiresCredential = true,
  configFormSchema,
  nodeId,
  onSaveConfig,
  onClose,
  initialConfig
}: NodeAction & {
  configFormSchema?: z.ZodSchema
  nodeId?: string
  onSaveConfig?: (data: any) => void
  onClose?: () => void
  initialConfig?: any
}) => {
  const { data: credentialsData, isLoading: isLoadingCredentials } =
    useGetCredentials()

  const credentials = credentialsData?.data || []

  const credentialSchema = z.object({
    credentialId: z.string().min(1, 'Please select a valid credential')
  })

  const formSchema = requiresCredential
    ? configFormSchema.merge(credentialSchema)
    : configFormSchema

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credentialId: '',
      maxResults: 10,
      from: '',
      to: '',
      subject: '',
      after: '',
      before: '',
      hasAttachment: false,
      isUnread: false,
      labelId: '',
      ...initialConfig
    }
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    // Call the callback to save configuration to the node
    if (onSaveConfig && nodeId) {
      onSaveConfig({
        nodeId,
        actionId: id,
        config: data
      })
    }

    // Close the dialog after saving
    if (onClose) {
      onClose()
    }
  }

  return (
    <Card className='h-full pr-2 rounded-none border-r border-b-0 border-l-0 border-t-0 flex flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
          <div className='bg-muted rounded p-1'>
            <ActionIcon className='h-4 w-4 text-primary' />
          </div>
          {label}
        </CardTitle>
        <Separator />
      </CardHeader>
      <CardContent className='p-0 flex-1 flex flex-col overflow-hidden'>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-1 flex-col overflow-hidden'
          >
            <div className='flex-1 overflow-y-scroll pl-4 pr-2 py-4 scrollbar-thin'>
              <div className='space-y-3'>
                {/* Credential Selection */}
                {requiresCredential && (
                  <Controller
                    control={form.control}
                    name='credentialId'
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className='text-xs'>
                          Pick your credential
                        </FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={
                            isLoadingCredentials || credentials.length === 0
                          }
                        >
                          <SelectTrigger
                            className='py-6 cursor-pointer w-full border-muted-foreground/20 bg-background hover:border-muted-foreground/40'
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue placeholder='Select credential' />
                          </SelectTrigger>
                          <SelectContent className='max-h-[300px]'>
                            {isLoadingCredentials ? (
                              <div className='flex items-center justify-center gap-2 py-4 px-2'>
                                <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                                <span className='text-sm text-muted-foreground'>
                                  Loading credentials...
                                </span>
                              </div>
                            ) : credentials.length === 0 ? (
                              <SelectItem value='no-credentials' disabled>
                                <span className='text-sm text-muted-foreground'>
                                  No credentials available
                                </span>
                              </SelectItem>
                            ) : (
                              credentials.map((cred: any) => {
                                const meta =
                                  CREDENTIALS_OPTIONS.find(
                                    (option) => option.id === cred.provider
                                  )
                                return (
                                  <SelectItem
                                    key={cred.id}
                                    value={cred.id}
                                    className='cursor-pointer'
                                  >
                                    <div className='flex items-center gap-3'>
                                      <ProviderIcon
                                        provider={cred.service || ''}
                                      />
                                      <div className='flex flex-col items-start gap-0.5'>
                                        <span className='text-sm capitalize font-medium'>
                                          {cred.provider}
                                        </span>
                                        {cred.service && (
                                          <span className='text-xs text-muted-foreground capitalize'>
                                            {cred.service ? cred.service.split('-').join(' ') : 'N/A'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </SelectItem>
                                )
                              })
                            )}
                          </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                )}

                {/* Action-specific Config Form */}
                {configForm && <div>{configForm}</div>}
              </div>
            </div>

            {/* Fixed Save Button */}
            <div className='px-4 py-3'>
              <Button type='submit' className='w-full' size='sm'>
                <Save className='mr-2 size-4' />
                Save Configuration
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}
