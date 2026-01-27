'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { PlaceholderInput } from '@/components/ui/placeholder-input'
import { Controller, useFormContext } from 'react-hook-form'

export function DeleteFolderForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='folderId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Folder ID</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='Enter the Google Drive folder ID'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              The folder ID can be found in the folder's URL
            </p>
          </Field>
        )}
      />
    </div>
  )
}
