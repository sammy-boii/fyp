'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { PlaceholderInput } from '@/components/ui/placeholder-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Controller, useFormContext } from 'react-hook-form'
import { DriveItemPicker } from './DriveItemPicker'
import { Image, FileText, File, Film, Music } from 'lucide-react'

const MIME_TYPES = [
  { value: 'image/png', label: 'PNG Image', icon: Image },
  { value: 'image/jpeg', label: 'JPEG Image', icon: Image },
  { value: 'image/gif', label: 'GIF Image', icon: Image },
  { value: 'image/webp', label: 'WebP Image', icon: Image },
  { value: 'image/svg+xml', label: 'SVG Image', icon: Image },
  { value: 'application/pdf', label: 'PDF Document', icon: FileText },
  { value: 'video/mp4', label: 'MP4 Video', icon: Film },
  { value: 'video/webm', label: 'WebM Video', icon: Film },
  { value: 'audio/mpeg', label: 'MP3 Audio', icon: Music },
  { value: 'audio/wav', label: 'WAV Audio', icon: Music },
  { value: 'application/octet-stream', label: 'Binary File', icon: File }
]

export function UploadFileForm() {
  const { control } = useFormContext()

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
              placeholder='Enter file name'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='data'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>File Data</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder="Enter file's base64 data"
              className='h-9 text-sm font-mono'
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
                {MIME_TYPES.map((type) => {
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

      <Controller
        name='parentFolderId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Destination Folder
              <span className='text-muted-foreground ml-1'>(optional)</span>
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
