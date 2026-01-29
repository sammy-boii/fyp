'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
          </Field>
        )}
      />

      <Controller
        name='outputFormat'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Output Format
            </FieldLabel>
            <Select
              value={field.value || 'auto'}
              onValueChange={field.onChange}
            >
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='Select output format' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='auto'>Auto</SelectItem>
                <SelectItem value='binary'>Binary (Base64)</SelectItem>
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
            <div className='text-xs text-muted-foreground mt-2 space-y-1.5'>
              <p>
                <span className='font-medium text-foreground'>Auto:</span>{' '}
                Returns readable text for documents (Docs, Sheets, PDFs) and
                base64 for images.
              </p>
              <p>
                <span className='font-medium text-foreground'>Binary:</span>{' '}
                Returns raw base64 data preserving exact file contents. Use this
                to copy files with all formatting intact.
              </p>
            </div>
          </Field>
        )}
      />
    </div>
  )
}
