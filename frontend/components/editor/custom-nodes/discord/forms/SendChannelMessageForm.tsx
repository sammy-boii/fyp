'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  PlaceholderInput,
  PlaceholderTextarea
} from '@/components/ui/placeholder-input'
import { Controller, useFormContext } from 'react-hook-form'

export function SendChannelMessageForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='channelId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Channel ID</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='Enter channel ID'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Right-click a channel in Discord and select &quot;Copy Channel
              ID&quot; (requires Developer Mode enabled)
            </p>
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
