'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Controller, useFormContext } from 'react-hook-form'
import { DriveItemPicker } from './DriveItemPicker'

export function DeleteFileForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='fileId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>File</FieldLabel>
            <DriveItemPicker
              value={field.value || ''}
              onChange={field.onChange}
              type='files'
              placeholder='Select file to delete'
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Select the file you want to delete
            </p>
          </Field>
        )}
      />
    </div>
  )
}
