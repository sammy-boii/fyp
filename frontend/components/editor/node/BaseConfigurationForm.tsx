'use client'

import { Button } from '@/components/ui/button'
import {
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { NodeAction } from '@/types/node.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'
import { useGetCredentials } from '@/hooks/use-credentials'
import Image from 'next/image'
import gmailIcon from '@/public/gmail.png'
import { useMemo } from 'react'

const providerMeta: Record<
  string,
  {
    name: string
    icon: string
  }
> = {
  google: { name: 'Google', icon: '/google-drive.png' },
  gmail: { name: 'Gmail', icon: '/gmail.png' }
}

function ProviderIcon({ provider }: { provider: string }) {
  const base = provider.toLowerCase()
  const meta = providerMeta[base]

  if (meta?.icon) {
    return (
      <div className='relative h-6 w-6 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900'>
        <Image
          src={gmailIcon}
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
  label,
  description,
  icon: ActionIcon,
  configForm
}: NodeAction) => {
  const { data: credentialsData, isLoading: isLoadingCredentials } =
    useGetCredentials()

  const credentials = useMemo(() => {
    if (!credentialsData?.data) return []
    return credentialsData.data
  }, [credentialsData])

  const formSchema = z.object({
    credentialId: z.string().min(1, 'Please select a credential.')
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credentialId: ''
    }
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast('Configuration saved', {
      description: `Credential ID: ${data.credentialId}`,
      position: 'bottom-right'
    })
  }

  return (
    <div className='flex flex-col gap-6'>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-6'
      >
        {/* Credential Selection */}
        <FieldGroup>
          <FieldLabel>Credential</FieldLabel>
          <FieldDescription>
            Select the credential to use for this action
          </FieldDescription>
          <Controller
            control={form.control}
            name='credentialId'
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoadingCredentials || credentials.length === 0}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a credential' />
                </SelectTrigger>
                <SelectContent>
                  {credentials.length === 0 ? (
                    <SelectItem value='no-credentials' disabled>
                      No credentials available
                    </SelectItem>
                  ) : (
                    credentials.map((cred: any) => {
                      const meta =
                        providerMeta[cred.provider?.toLowerCase() || '']
                      return (
                        <SelectItem key={cred.id} value={cred.id}>
                          <div className='flex items-center gap-2'>
                            <ProviderIcon provider={cred.provider || ''} />
                            <div className='flex flex-col'>
                              <span className='text-sm font-medium'>
                                {meta?.name || cred.provider}
                              </span>
                              {cred.service && (
                                <span className='text-xs text-muted-foreground'>
                                  {cred.service}
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
            )}
          />
          <FieldError>{form.formState.errors.credentialId?.message}</FieldError>
        </FieldGroup>

        {/* Action-specific Config Form */}
        {configForm && (
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              {ActionIcon && (
                <ActionIcon className='h-4 w-4 text-muted-foreground' />
              )}
              <FieldLabel>{label} Configuration</FieldLabel>
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            <div className='rounded-md border p-4'>{configForm}</div>
          </div>
        )}

        <Button type='submit' className='w-full'>
          <Save className='mr-2 h-4 w-4' />
          Save Configuration
        </Button>
      </form>
    </div>
  )
}
