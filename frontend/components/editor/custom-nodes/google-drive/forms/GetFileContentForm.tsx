'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Controller, useFormContext } from 'react-hook-form'
import { DriveItemPicker } from './DriveItemPicker'

export function GetFileContentForm() {
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
              placeholder='Select file to read'
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Supports: Text files, Google Docs, Google Sheets, PDFs
            </p>
          </Field>
        )}
      />
    </div>
  )
}
