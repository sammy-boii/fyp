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
import {
  FileSpreadsheet,
  File,
  Code,
  Image,
  FileType,
  Info
} from 'lucide-react'
import { DriveItemPicker } from './DriveItemPicker'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

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
              <FieldLabel className='text-xs font-medium flex items-center gap-1'>
                Image Data
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-3.5 w-3.5 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent side='top' className='max-w-[250px]'>
                    <p>
                      Only accepts base64 data. Use Get File Content to get
                      base64 data.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </FieldLabel>
              <PlaceholderInput
                type='text'
                placeholder='{{node_id.data}} or paste base64 data'
                className='h-9 text-sm font-mono'
                {...field}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      )}

      {/* PDF content - accepts base64 or plain text */}
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
                placeholder='{{node_id.base64}} or enter plain text...'
                rows={5}
                className='resize-none text-sm font-mono'
                {...field}
                aria-invalid={fieldState.invalid}
              />
              <div className='text-xs text-muted-foreground mt-1.5 space-y-1'>
                <p>
                  <span className='font-medium text-foreground'>
                    Copy existing PDF:
                  </span>{' '}
                  Use Get File Content with Binary format, then pass the base64
                  data here.
                </p>
                <p>
                  <span className='font-medium text-foreground'>
                    Create new PDF:
                  </span>{' '}
                  Enter plain text and it will be converted to a PDF.
                </p>
              </div>
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
