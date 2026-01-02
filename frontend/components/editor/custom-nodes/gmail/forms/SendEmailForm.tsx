'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group'
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
            <Input
              type='email'
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
            <Input
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
            <InputGroup>
              <InputGroupTextarea
                placeholder='Type your message here...'
                rows={5}
                className='resize-none text-sm'
                {...field}
                aria-invalid={fieldState.invalid}
              />
            </InputGroup>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}
