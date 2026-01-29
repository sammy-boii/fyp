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
            <p className='text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-1'>
              <span className='text-muted-foreground/70'>Supports:</span>
              <span className='px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium'>
                Text
              </span>
              <span className='px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium'>
                Google Docs
              </span>
              <span className='px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium'>
                Sheets
              </span>
              <span className='px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium'>
                PDFs
              </span>
              <span className='px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium'>
                Images
              </span>
            </p>
          </Field>
        )}
      />
    </div>
  )
}
