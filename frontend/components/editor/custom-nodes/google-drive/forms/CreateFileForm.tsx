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
import { FileSpreadsheet, File, Code, Image, FileType } from 'lucide-react'
import { DriveItemPicker } from './DriveItemPicker'

const FILE_TYPES = [
  {
    value: 'text/plain',
    label: 'Plain Text',
    icon: File,
    category: 'text'
  },
  {
    value: 'text/html',
    label: 'HTML File',
    icon: Code,
    category: 'text'
  },
  {
    value: 'text/csv',
    label: 'CSV File',
    icon: FileSpreadsheet,
    category: 'text'
  },
  { value: 'image/png', label: 'PNG Image', icon: Image, category: 'image' },
  { value: 'image/jpeg', label: 'JPEG Image', icon: Image, category: 'image' },
  { value: 'image/gif', label: 'GIF Image', icon: Image, category: 'image' },
  { value: 'image/webp', label: 'WebP Image', icon: Image, category: 'image' },
  {
    value: 'image/svg+xml',
    label: 'SVG Image',
    icon: Image,
    category: 'image'
  },
  {
    value: 'application/pdf',
    label: 'PDF Document',
    icon: FileType,
    category: 'pdf'
  }
]

export function CreateFileForm() {
  const { control, watch } = useFormContext()
  const mimeType = watch('mimeType')

  // Determine what type of content input to show
  const selectedType = FILE_TYPES.find((t) => t.value === mimeType)
  const category = selectedType?.category || 'text'

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
              placeholder={
                category === 'image'
                  ? 'image.png'
                  : category === 'pdf'
                    ? 'document.pdf'
                    : 'Enter file name'
              }
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

      {/* Text content for text-based files */}
      {category === 'text' && (
        <Controller
          name='content'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-xs font-medium'>
                Content
                <span className='text-muted-foreground ml-0.5'>(optional)</span>
              </FieldLabel>
              <PlaceholderTextarea
                placeholder='Enter file content...'
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

      {/* Base64 input for images */}
      {category === 'image' && (
        <Controller
          name='content'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-xs font-medium'>
                Image Data (Base64)
              </FieldLabel>
              <PlaceholderInput
                type='text'
                placeholder='Enter image data'
                className='h-9 text-sm font-mono'
                {...field}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      )}

      {/* Text content for PDF (will be converted to PDF on backend) */}
      {category === 'pdf' && (
        <Controller
          name='content'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-xs font-medium'>
                PDF Content
              </FieldLabel>
              <PlaceholderTextarea
                placeholder='Enter text content for PDF...'
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

      <Controller
        name='parentFolderId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Parent Folder
              <span className='text-muted-foreground ml-0.5'>(optional)</span>
            </FieldLabel>
            <DriveItemPicker
              value={field.value || ''}
              onChange={field.onChange}
              type='folders'
              placeholder='Root folder'
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}
