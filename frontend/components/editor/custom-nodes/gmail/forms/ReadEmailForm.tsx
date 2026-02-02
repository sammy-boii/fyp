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
import { Controller, useFormContext } from 'react-hook-form'
import {
  Inbox,
  Send,
  FileEdit,
  AlertOctagon,
  Trash2,
  Star,
  Flag,
  Mail
} from 'lucide-react'

const GMAIL_LABELS = [
  { value: 'INBOX', label: 'Inbox', icon: Inbox },
  { value: 'SENT', label: 'Sent', icon: Send },
  { value: 'DRAFT', label: 'Drafts', icon: FileEdit },
  { value: 'SPAM', label: 'Spam', icon: AlertOctagon },
  { value: 'TRASH', label: 'Trash', icon: Trash2 },
  { value: 'STARRED', label: 'Starred', icon: Star },
  { value: 'IMPORTANT', label: 'Important', icon: Flag },
  { value: 'UNREAD', label: 'Unread', icon: Mail }
]

export function ReadEmailForm() {
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
              Number of Emails
            </FieldLabel>
            <Input
              type='number'
              min={1}
              max={100}
              placeholder='10'
              className='h-9 text-sm'
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {/* Label Filter */}
      <Controller
        name='labelId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Email Folder
            </FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='All emails' />
              </SelectTrigger>
              <SelectContent>
                {GMAIL_LABELS.map((label) => {
                  const Icon = label.icon
                  return (
                    <SelectItem key={label.value} value={label.value}>
                      <div className='flex items-center gap-2'>
                        <Icon className='h-4 w-4 text-muted-foreground' />
                        {label.label}
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

      {/* Toggle Options */}
      <div className='space-y-3 pt-2'>
        {/* Mark as Read */}
        <Controller
          name='markAsRead'
          control={control}
          render={({ field }) => (
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='space-y-0.5'>
                <label
                  htmlFor='markAsRead'
                  className='text-sm font-medium cursor-pointer'
                >
                  Mark as Read
                </label>
                <p className='text-xs text-muted-foreground'>
                  Auto-mark fetched emails as read
                </p>
              </div>
              <Switch
                id='markAsRead'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />

        {/* Include Body */}
        <Controller
          name='includeBody'
          control={control}
          render={({ field }) => (
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='space-y-0.5'>
                <label
                  htmlFor='includeBody'
                  className='text-sm font-medium cursor-pointer'
                >
                  Include Body
                </label>
                <p className='text-xs text-muted-foreground'>
                  Include full email body content
                </p>
              </div>
              <Switch
                id='includeBody'
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />

        {/* Include Attachments */}
        <Controller
          name='includeAttachments'
          control={control}
          render={({ field }) => (
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='space-y-0.5'>
                <label
                  htmlFor='includeAttachments'
                  className='text-sm font-medium cursor-pointer'
                >
                  Include Attachments
                </label>
                <p className='text-xs text-muted-foreground'>
                  Download attachment data (base64)
                </p>
              </div>
              <Switch
                id='includeAttachments'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />
      </div>
    </div>
  )
}

