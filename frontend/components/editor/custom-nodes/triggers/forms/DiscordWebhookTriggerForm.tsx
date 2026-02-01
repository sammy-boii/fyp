'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Controller, useFormContext } from 'react-hook-form'
import { GuildPicker } from '@/components/editor/custom-nodes/discord/forms/GuildPicker'
import { ChannelPicker } from '@/components/editor/custom-nodes/discord/forms/ChannelPicker'
import { UserPicker } from '@/components/editor/custom-nodes/discord/forms/UserPicker'

export function DiscordWebhookTriggerForm() {
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
            <p className='text-xs text-muted-foreground mt-1'>
              Select the Discord server to listen for messages
            </p>
          </Field>
        )}
      />

      <Controller
        name='channelId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Channel</FieldLabel>
            <ChannelPicker
              value={field.value || ''}
              onChange={field.onChange}
              channelType='text'
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Select the channel to listen for new messages
            </p>
          </Field>
        )}
      />

      <Controller
        name='userId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              User Filter (Optional)
            </FieldLabel>
            <UserPicker
              value={field.value || ''}
              onChange={field.onChange}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Optionally filter messages from a specific user
            </p>
          </Field>
        )}
      />
    </div>
  )
}
