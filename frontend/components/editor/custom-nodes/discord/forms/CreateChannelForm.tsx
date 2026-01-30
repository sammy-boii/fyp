'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  PlaceholderInput,
  PlaceholderTextarea
} from '@/components/ui/placeholder-input'
import { Controller, useFormContext } from 'react-hook-form'

export function CreateChannelForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='guildId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Server ID</FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='Enter server ID'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Right-click a server in Discord and select "Copy Server ID"
            </p>
          </Field>
        )}
      />

      <Controller
        name='name'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Channel Name
            </FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='general-chat'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Channel names are automatically lowercased and spaces are replaced
              with hyphens
            </p>
          </Field>
        )}
      />

      <Controller
        name='type'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Channel Type
            </FieldLabel>
            <Select
              value={field.value || 'text'}
              onValueChange={field.onChange}
            >
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='Select channel type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='text'>Text Channel</SelectItem>
                <SelectItem value='voice'>Voice Channel</SelectItem>
                <SelectItem value='announcement'>
                  Announcement Channel
                </SelectItem>
                <SelectItem value='forum'>Forum Channel</SelectItem>
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='topic'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Topic (Optional)
            </FieldLabel>
            <PlaceholderTextarea
              placeholder='Channel topic or description...'
              rows={2}
              className='resize-none text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='parentId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Category ID (Optional)
            </FieldLabel>
            <PlaceholderInput
              type='text'
              placeholder='Enter category ID'
              className='h-9 text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Place the channel under a specific category
            </p>
          </Field>
        )}
      />
    </div>
  )
}
