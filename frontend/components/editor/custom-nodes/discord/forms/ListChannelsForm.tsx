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
import {
  Hash,
  Volume2,
  Folder,
  Megaphone,
  MessageSquare,
  LayoutList
} from 'lucide-react'

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
                <SelectItem value='all'>
                  <div className='flex items-center gap-2'>
                    <LayoutList className='h-4 w-4 text-muted-foreground' />
                    <span>All Types</span>
                  </div>
                </SelectItem>
                <SelectItem value='text'>
                  <div className='flex items-center gap-2'>
                    <Hash className='h-4 w-4 text-muted-foreground' />
                    <span>Text Channels</span>
                  </div>
                </SelectItem>
                <SelectItem value='voice'>
                  <div className='flex items-center gap-2'>
                    <Volume2 className='h-4 w-4 text-muted-foreground' />
                    <span>Voice Channels</span>
                  </div>
                </SelectItem>
                <SelectItem value='category'>
                  <div className='flex items-center gap-2'>
                    <Folder className='h-4 w-4 text-muted-foreground' />
                    <span>Categories</span>
                  </div>
                </SelectItem>
                <SelectItem value='announcement'>
                  <div className='flex items-center gap-2'>
                    <Megaphone className='h-4 w-4 text-muted-foreground' />
                    <span>Announcement Channels</span>
                  </div>
                </SelectItem>
                <SelectItem value='forum'>
                  <div className='flex items-center gap-2'>
                    <MessageSquare className='h-4 w-4 text-muted-foreground' />
                    <span>Forum Channels</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}
