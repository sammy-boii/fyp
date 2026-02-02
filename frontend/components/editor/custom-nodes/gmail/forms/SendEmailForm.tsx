'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  PlaceholderInput,
  PlaceholderTextarea
} from '@/components/ui/placeholder-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useGetCredentials } from '@/hooks/use-credentials'
import { Loader2, Link2, HardDrive, Plus } from 'lucide-react'
import {
  Controller,
  useFormContext,
  FormProvider,
  useForm
} from 'react-hook-form'
import React from 'react'
import { DriveItemPicker } from '@/components/editor/custom-nodes/google-drive/forms/DriveItemPicker'
import Image from 'next/image'
import { CREDENTIALS_OPTIONS } from '@/constants/registry'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

function ProviderIcon({ provider }: { provider: string }) {
  const base = provider.toLowerCase()
  const meta = CREDENTIALS_OPTIONS.find((option) => option.id === base)

  if (meta?.icon) {
    return (
      <div className='relative h-5 w-5 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900'>
        <Image
          src={meta.icon}
          alt={meta.name}
          fill
          sizes='20px'
          className='object-contain p-0.5'
        />
      </div>
    )
  }

  return (
    <div className='flex h-5 w-5 items-center justify-center rounded-md bg-muted text-xs font-semibold uppercase'>
      {provider.slice(0, 2)}
    </div>
  )
}

export function SendEmailForm() {
  const { control, watch } = useFormContext()
  const attachmentType = watch('attachmentType') || 'url'
  const driveCredentialId = watch('driveCredentialId')

  const { data: credentialsData, isLoading: isLoadingCredentials } =
    useGetCredentials()
  const driveCredentials = (credentialsData?.data || []).filter(
    (cred) => cred.service === 'google-drive'
  )

  // Create a nested form for DriveItemPicker
  const driveForm = useForm({
    defaultValues: {
      credentialId: driveCredentialId || ''
    }
  })

  // Sync driveCredentialId from parent form to nested form
  React.useEffect(() => {
    driveForm.setValue('credentialId', driveCredentialId || '')
  }, [driveCredentialId, driveForm])

  return (
    <div className='space-y-4'>
      {/* To */}
      <Controller
        name='to'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>To</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='recipient@example.com'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {/* CC */}
      <Controller
        name='cc'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>CC</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='cc1@example.com, cc2@example.com'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <p className='text-xs text-muted-foreground mt-1'>
              Separate multiple addresses with commas
            </p>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {/* BCC */}
      <Controller
        name='bcc'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>BCC</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='bcc@example.com'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <p className='text-xs text-muted-foreground mt-1'>
              Hidden recipients
            </p>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {/* Subject */}
      <Controller
        control={control}
        name='subject'
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Subject</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='Email subject'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {/* Body */}
      <Controller
        control={control}
        name='body'
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Body</FieldLabel>
            <PlaceholderTextarea
              placeholder='Type your message here...'
              rows={5}
              className='resize-none text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {/* Attachment Type */}
      <Controller
        name='attachmentType'
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel className='text-xs font-medium'>
              Attachment Type
            </FieldLabel>
            <Select value={field.value || 'url'} onValueChange={field.onChange}>
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='Select attachment type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='url'>
                  <div className='flex items-center gap-2'>
                    <Link2 className='h-4 w-4 text-muted-foreground' />
                    Public URL
                  </div>
                </SelectItem>
                <SelectItem value='drive'>
                  <div className='flex items-center gap-2'>
                    <HardDrive className='h-4 w-4 text-muted-foreground' />
                    Google Drive File
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      {/* Drive Credential - Show first when Drive is selected */}
      {attachmentType === 'drive' && (
        <Controller
          name='driveCredentialId'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-xs'>Pick Drive Credential</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoadingCredentials || driveCredentials.length === 0}
              >
                <SelectTrigger
                  className='py-6 cursor-pointer w-full border-muted-foreground/20 bg-background hover:border-muted-foreground/40'
                  aria-invalid={fieldState.invalid}
                >
                  {isLoadingCredentials ? (
                    <div className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                      <span className='text-muted-foreground'>
                        Loading credentials...
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder='Select Drive credential' />
                  )}
                </SelectTrigger>
                <SelectContent className='max-h-[300px]'>
                  {isLoadingCredentials ? (
                    <div className='flex items-center justify-center gap-2 py-4 px-2'>
                      <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                      <span className='text-sm text-muted-foreground'>
                        Loading credentials...
                      </span>
                    </div>
                  ) : driveCredentials.length === 0 ? (
                    <SelectItem value='no-credentials' disabled>
                      <span className='text-sm text-muted-foreground'>
                        No Drive credentials available
                      </span>
                    </SelectItem>
                  ) : (
                    driveCredentials.map((cred: any) => {
                      return (
                        <SelectItem
                          key={cred.id}
                          value={cred.id}
                          className='cursor-pointer'
                        >
                          <div className='flex items-center gap-3'>
                            <ProviderIcon provider={cred.service || ''} />
                            <div className='flex flex-col items-start gap-0.5'>
                              <span className='text-sm capitalize font-medium'>
                                {cred.provider}
                              </span>
                              {cred.service && (
                                <span className='text-xs text-muted-foreground capitalize'>
                                  {cred.service
                                    ? cred.service.split('-').join(' ')
                                    : 'N/A'}
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })
                  )}
                  <Separator className='my-1' />
                  <Link href='/credentials' className='block'>
                    <div className='flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm cursor-pointer transition-colors'>
                      <Plus className='h-4 w-4' />
                      <span>Add Credential</span>
                    </div>
                  </Link>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      )}

      {/* Attachments */}
      <Controller
        control={control}
        name='attachments'
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              {attachmentType === 'drive' ? 'Drive File' : 'Attachments'}
            </FieldLabel>
            {attachmentType === 'drive' ? (
              <FormProvider {...driveForm}>
                <DriveItemPicker
                  value={field.value || ''}
                  onChange={field.onChange}
                  type='files'
                  placeholder='Select a Drive file or enter ID...'
                  aria-invalid={fieldState.invalid}
                  disabled={!driveCredentialId}
                />
              </FormProvider>
            ) : (
              <PlaceholderInput
                type='text'
                placeholder='https://example.com/file.pdf'
                className='h-9 text-sm'
                {...field}
                aria-invalid={fieldState.invalid}
              />
            )}
            <p className='text-xs text-muted-foreground mt-1'>
              {attachmentType === 'drive'
                ? driveCredentialId
                  ? 'Select a file or manually enter the file ID.'
                  : 'Select a Drive credential first.'
                : 'Public URL only. Separate multiple with commas.'}
            </p>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}
