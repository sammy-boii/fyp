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
import { GuildPicker } from './GuildPicker'

export function ListChannelsForm() {
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
        name='channelType'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Channel Type (Optional)
            </FieldLabel>
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='All channel types' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='text'>Text Channels</SelectItem>
                <SelectItem value='voice'>Voice Channels</SelectItem>
                <SelectItem value='category'>Categories</SelectItem>
                <SelectItem value='announcement'>
                  Announcement Channels
                </SelectItem>
                <SelectItem value='forum'>Forum Channels</SelectItem>
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}
