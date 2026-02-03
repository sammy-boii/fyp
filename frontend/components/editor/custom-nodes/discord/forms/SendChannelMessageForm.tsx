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
import { Controller, useFormContext } from 'react-hook-form'
import { GuildPicker } from './GuildPicker'
import { ChannelPicker } from './ChannelPicker'
import { Link, Paperclip } from 'lucide-react'

export function SendChannelMessageForm() {
  const { control, watch } = useFormContext()
  const attachmentMode = watch('attachmentMode')

  return (
    <div className='space-y-4'>
      <Controller
        name='guildId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Server</FieldLabel>
            <GuildPicker
              value={field.value || ''}
              onChange={field.onChange}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='channelId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Channel</FieldLabel>
            <ChannelPicker
              value={field.value || ''}
              onChange={field.onChange}
              channelType='all'
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='content'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Message</FieldLabel>
            <PlaceholderTextarea
              placeholder='Type your message here...'
              rows={4}
              className='resize-none text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='attachmentMode'
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel className='text-xs font-medium'>
              Attachment Type
            </FieldLabel>
            <Select value={field.value || 'url'} onValueChange={field.onChange}>
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='Select type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='url'>
                  <div className='flex items-center gap-2'>
                    <Link className='h-4 w-4 text-muted-foreground' />
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

      {attachmentMode !== 'base64' ? (
        <Controller
          name='attachmentUrls'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-xs font-medium'>
                Attachments
              </FieldLabel>
              <PlaceholderInput
                placeholder='Enter the public URL'
                className='resize-none text-sm h-9'
                {...field}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
              <p className='text-xs text-muted-foreground mt-1'>
                Supports direct URLs or attachment data from previous nodes
              </p>
            </Field>
          )}
        />
      ) : (
        <>
          <Controller
            name='attachmentData'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-xs font-medium'>
                  File data (Base64)
                </FieldLabel>
                <PlaceholderInput
                  placeholder='Enter base64 data'
                  className='resize-none text-sm h-9'
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
                <p className='text-xs text-muted-foreground mt-1'>
                  Use base64 data or attachment output from previous nodes
                </p>
              </Field>
            )}
          />

          <Controller
            name='attachmentFilename'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-xs font-medium'>
                  Filename (Optional)
                </FieldLabel>
                <PlaceholderInput
                  type='text'
                  placeholder='e.g. image.png'
                  className='h-9 text-sm'
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
                <p className='text-xs text-muted-foreground mt-1'>
                  Used as the Discord attachment name.
                </p>
              </Field>
            )}
          />
        </>
      )}
    </div>
  )
}
