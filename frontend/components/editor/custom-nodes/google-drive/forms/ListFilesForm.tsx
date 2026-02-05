'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Controller, useFormContext } from 'react-hook-form'
import {
  FileText,
  Image,
  FileSpreadsheet,
  Folder,
  File,
  Files,
  Info
} from 'lucide-react'
import { DriveItemPicker } from './DriveItemPicker'

const FILE_TYPES = [
  { value: 'all', label: 'All Files', icon: Files },
  { value: 'folder', label: 'Folders Only', icon: Folder },
  { value: 'document', label: 'Documents', icon: FileText },
  { value: 'spreadsheet', label: 'Spreadsheets', icon: FileSpreadsheet },
  { value: 'image', label: 'Images', icon: Image },
  { value: 'pdf', label: 'PDF Files', icon: File }
]

export function ListFilesForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      {/* Max Results */}
      <Controller
        name='maxResults'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Number of Files
            </FieldLabel>
            <Input
              type='number'
              min={1}
              max={100}
              placeholder='50'
              className='h-9 text-sm'
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {/* File Type Filter */}
      <Controller
        name='fileType'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>File Type</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='All Files' />
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

      {/* Folder ID */}
      <Controller
        name='folderId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Folder
              <span className='text-muted-foreground ml-0.5'>(optional)</span>
            </FieldLabel>
            <DriveItemPicker
              value={field.value || ''}
              onChange={field.onChange}
              type='folders'
              placeholder='Select folder or leave for root'
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {/* Include Content */}
      <Controller
        name='includeContent'
        control={control}
        render={({ field }) => (
          <Field>
            <div className='flex items-center justify-between'>
              <FieldLabel className='text-xs font-medium flex items-center gap-1'>
                Include File Content
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-3.5 w-3.5 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent side='top'>
                    Not recommended unless absolutely required
                  </TooltipContent>
                </Tooltip>
              </FieldLabel>
              <Switch
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            </div>
          </Field>
        )}
      />
    </div>
  )
}
