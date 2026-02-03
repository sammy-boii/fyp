'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { PlaceholderInput } from '@/components/ui/placeholder-input'
import { Controller, useFormContext } from 'react-hook-form'

export function DeleteEmailForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='messageId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Message ID</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='e.g. 18c2b7a9f3e2c8d7'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Moves the message to Trash. Use a message ID from Gmail Read.
            </p>
          </Field>
        )}
      />
    </div>
  )
}
