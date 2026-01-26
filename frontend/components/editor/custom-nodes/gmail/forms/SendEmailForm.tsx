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
    </div>
  )
}
