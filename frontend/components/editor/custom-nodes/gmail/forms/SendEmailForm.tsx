'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  PlaceholderInput,
  PlaceholderTextarea
} from '@/components/ui/placeholder-input'
import { Controller, useFormContext } from 'react-hook-form'

export function SendEmailForm() {
  const { control } = useFormContext()

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

      {/* Attachments */}
      <Controller
        control={control}
        name='attachments'
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Attachments</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='Enter drive file ID or file link'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <p className='text-xs text-muted-foreground mt-1'>
              URL or Google Drive file ID. Separate multiple with commas.
            </p>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}
