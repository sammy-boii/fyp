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
import { Link2, Paperclip } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'

export function SendEmailForm() {
  const { control, watch } = useFormContext()
  const attachmentType = watch('attachmentType') || 'url'

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
                <SelectItem value='base64'>
                  <div className='flex items-center gap-2'>
                    <Paperclip className='h-4 w-4 text-muted-foreground' />
                    File data (Base64)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
            {attachmentType === 'url' ? (
              <PlaceholderInput
                type='text'
                placeholder='https://example.com/file.pdf'
                className='h-9 text-sm'
                {...field}
                aria-invalid={fieldState.invalid}
              />
            ) : (
              <PlaceholderInput
                placeholder='Enter base64 data'
                className='resize-none text-sm'
                {...field}
                aria-invalid={fieldState.invalid}
              />
            )}
            <p className='text-xs text-muted-foreground mt-1'>
              {attachmentType === 'url'
                ? 'Public URL only. Separate multiple with commas.'
                : 'Use base64 data or attachment output from previous nodes.'}
            </p>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {attachmentType === 'base64' && (
        <Controller
          control={control}
          name='attachmentFilename'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-xs font-medium'>
                Filename (Optional)
              </FieldLabel>
              <PlaceholderInput
                type='text'
                placeholder='e.g. invoice.pdf'
                className='h-9 text-sm'
                {...field}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
              <p className='text-xs text-muted-foreground mt-1'>
                Used as the Gmail attachment name.
              </p>
            </Field>
          )}
        />
      )}
    </div>
  )
}
