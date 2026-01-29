'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  PlaceholderInput,
  PlaceholderTextarea
} from '@/components/ui/placeholder-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Controller, useFormContext } from 'react-hook-form'
import { FileText, FileSpreadsheet, File, Code } from 'lucide-react'
import { DriveItemPicker } from './DriveItemPicker'

const FILE_TYPES = [
  { value: 'text/plain', label: 'Plain Text (.txt)', icon: File },
  {
    value: 'application/vnd.google-apps.document',
    label: 'Google Doc',
    icon: FileText
  },
  {
    value: 'application/vnd.google-apps.spreadsheet',
    label: 'Google Sheet',
    icon: FileSpreadsheet
  },
  { value: 'text/html', label: 'HTML File', icon: Code },
  { value: 'text/csv', label: 'CSV File', icon: FileSpreadsheet }
]

export function CreateFileForm() {
  const { control, watch } = useFormContext()
  const mimeType = watch('mimeType')

  // Google Docs types don't support content on creation
  const isGoogleDocsType = mimeType?.startsWith('application/vnd.google-apps.')

  return (
    <div className='space-y-4'>
      <Controller
        name='name'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>File Name</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='my-file.txt'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='mimeType'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>File Type</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='Select file type' />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className='flex items-center gap-2'>
                        <Icon className='h-4 w-4 text-muted-foreground' />
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {!isGoogleDocsType && (
        <Controller
          name='content'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-xs font-medium'>
                File Content
                <span className='text-muted-foreground ml-1'>(optional)</span>
              </FieldLabel>
              <PlaceholderTextarea
                placeholder='Enter the file content...'
                rows={5}
                className='resize-none text-sm'
                {...field}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      )}

      {isGoogleDocsType && (
        <p className='text-xs text-muted-foreground'>
          Note: Google Docs/Sheets are created empty. You can edit the content
          in Google Drive after creation.
        </p>
      )}

      <Controller
        name='parentFolderId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Parent Folder
              <span className='text-muted-foreground ml-1'>(optional)</span>
            </FieldLabel>
            <DriveItemPicker
              value={field.value || ''}
              onChange={field.onChange}
              type='folders'
              placeholder='Select parent folder or leave for root'
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}
