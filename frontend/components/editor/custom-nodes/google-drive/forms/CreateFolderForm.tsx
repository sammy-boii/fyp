'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { PlaceholderInput } from '@/components/ui/placeholder-input'
import { Controller, useFormContext } from 'react-hook-form'

export function CreateFolderForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='name'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Folder Name</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='My New Folder'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='parentFolderId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Parent Folder ID
              <span className='text-muted-foreground ml-1'>(optional)</span>
            </FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='Leave empty for root folder'
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
