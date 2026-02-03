'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
              <PlaceholderTextarea
                placeholder='Paste file URLs (one per line or comma-separated)'
                rows={3}
                className='resize-none text-sm'
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
                <PlaceholderTextarea
                  placeholder='Paste base64 data or use a placeholder like {{nodeId.attachments}}'
                  rows={3}
                  className='resize-none text-sm'
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

      <Controller
        name='embedTitle'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Embed Title (Optional)
            </FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='Embed title'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='embedDescription'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Embed Description (Optional)
            </FieldLabel>
            <PlaceholderTextarea
              placeholder='Embed description...'
              rows={3}
              className='resize-none text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='embedColor'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Embed Color (Optional)
            </FieldLabel>
            <Input
              type='color'
              className='h-9 w-16 p-1 cursor-pointer'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}
