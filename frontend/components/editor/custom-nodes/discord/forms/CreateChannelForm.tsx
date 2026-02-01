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
import { GuildPicker } from './GuildPicker'
import { Hash, Volume2, Megaphone, MessageSquare } from 'lucide-react'

export function CreateChannelForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='guildId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Server</FieldLabel>
            <GuildPicker
              value={field.value || ''}
              onChange={field.onChange}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
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
                <SelectItem value='text'>
                  <div className='flex items-center gap-2'>
                    <Hash className='h-4 w-4 text-muted-foreground' />
                    <span>Text Channel</span>
                  </div>
                </SelectItem>
                <SelectItem value='voice'>
                  <div className='flex items-center gap-2'>
                    <Volume2 className='h-4 w-4 text-muted-foreground' />
                    <span>Voice Channel</span>
                  </div>
                </SelectItem>
                <SelectItem value='announcement'>
                  <div className='flex items-center gap-2'>
                    <Megaphone className='h-4 w-4 text-muted-foreground' />
                    <span>Announcement Channel</span>
                  </div>
                </SelectItem>
                <SelectItem value='forum'>
                  <div className='flex items-center gap-2'>
                    <MessageSquare className='h-4 w-4 text-muted-foreground' />
                    <span>Forum Channel</span>
                  </div>
                </SelectItem>
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
    </div>
  )
}
