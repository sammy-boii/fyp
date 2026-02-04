'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
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

export function GmailWebhookTriggerForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='labelId'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Email Folder (Optional)
            </FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='All inbox emails' />
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
            <p className='text-xs text-muted-foreground mt-1'>
              Only trigger when a new email arrives in this folder.
            </p>
          </Field>
        )}
      />

      <div className='space-y-3 pt-2'>
        <Controller
          name='markAsRead'
          control={control}
          render={({ field }) => (
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='space-y-0.5'>
                <label
                  htmlFor='gmailWebhookMarkAsRead'
                  className='text-sm font-medium cursor-pointer'
                >
                  Mark as Read
                </label>
                <p className='text-xs text-muted-foreground'>
                  Auto-mark triggered emails as read
                </p>
              </div>
              <Switch
                id='gmailWebhookMarkAsRead'
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />

        <Controller
          name='includeBody'
          control={control}
          render={({ field }) => (
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='space-y-0.5'>
                <label
                  htmlFor='gmailWebhookIncludeBody'
                  className='text-sm font-medium cursor-pointer'
                >
                  Include Body
                </label>
                <p className='text-xs text-muted-foreground'>
                  Include full email body content
                </p>
              </div>
              <Switch
                id='gmailWebhookIncludeBody'
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />

        <Controller
          name='includeAttachments'
          control={control}
          render={({ field }) => (
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='space-y-0.5'>
                <label
                  htmlFor='gmailWebhookIncludeAttachments'
                  className='text-sm font-medium cursor-pointer'
                >
                  Include Attachments
                </label>
                <p className='text-xs text-muted-foreground'>
                  Supports images, PDF, docx and xlsx files
                </p>
              </div>
              <Switch
                id='gmailWebhookIncludeAttachments'
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />
      </div>
    </div>
  )
}
