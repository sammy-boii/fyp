'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  PlaceholderInput,
  PlaceholderTextarea
} from '@/components/ui/placeholder-input'
import { Controller, useFormContext } from 'react-hook-form'

export function SendMessageForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='webhookUrl'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Webhook URL</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='https://discord.com/api/webhooks/...'
              className='h-9 text-sm'
              {...field}
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
        name='username'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Username (Optional)
            </FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='Custom webhook username'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='avatarUrl'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Avatar URL (Optional)
            </FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='https://example.com/avatar.png'
              className='h-9 text-sm'
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
