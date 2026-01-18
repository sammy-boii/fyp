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
import { Separator } from '@/components/ui/separator'

const GMAIL_LABELS = [
  { value: 'INBOX', label: 'Inbox' },
  { value: 'SENT', label: 'Sent' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'TRASH', label: 'Trash' },
  { value: 'STARRED', label: 'Starred' },
  { value: 'IMPORTANT', label: 'Important' },
  { value: 'UNREAD', label: 'Unread' }
]

export function ReadEmailForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-5'>
      {/* Basic Settings */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
            Basic Settings
          </span>
        </div>

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
                  {GMAIL_LABELS.map((label) => (
                    <SelectItem key={label.value} value={label.value}>
                      {label.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </div>

      <Separator />

      {/* Sender/Recipient Filters */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
            Filter by People
          </span>
        </div>

        {/* From */}
        <Controller
          name='from'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-xs font-medium'>From</FieldLabel>
              <Input
                type='email'
                placeholder='sender@example.com'
                className='h-9 text-sm'
                {...field}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        {/* To */}
        <Controller
          name='to'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-xs font-medium'>To</FieldLabel>
              <Input
                type='email'
                placeholder='recipient@example.com'
                className='h-9 text-sm'
                {...field}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        {/* Subject */}
        <Controller
          name='subject'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-xs font-medium'>
                Subject Contains
              </FieldLabel>
              <Input
                type='text'
                placeholder='Meeting notes'
                className='h-9 text-sm'
                {...field}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </div>

      <Separator />

      {/* Date Filters */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
            Date Range
          </span>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          {/* After Date */}
          <Controller
            name='after'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-xs font-medium'>After</FieldLabel>
                <Input
                  type='date'
                  className='h-9 text-sm'
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {/* Before Date */}
          <Controller
            name='before'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-xs font-medium'>Before</FieldLabel>
                <Input
                  type='date'
                  className='h-9 text-sm'
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Toggle Filters */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
            Additional Filters
          </span>
        </div>

        {/* Unread Only */}
        <Controller
          name='isUnread'
          control={control}
          render={({ field }) => (
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='space-y-0.5'>
                <label
                  htmlFor='isUnread'
                  className='text-sm font-medium cursor-pointer'
                >
                  Unread Only
                </label>
                <p className='text-xs text-muted-foreground'>
                  Only fetch unread emails
                </p>
              </div>
              <Switch
                id='isUnread'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />

        {/* Has Attachment */}
        <Controller
          name='hasAttachment'
          control={control}
          render={({ field }) => (
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='space-y-0.5'>
                <label
                  htmlFor='hasAttachment'
                  className='text-sm font-medium cursor-pointer'
                >
                  Has Attachment
                </label>
                <p className='text-xs text-muted-foreground'>
                  Only fetch emails with attachments
                </p>
              </div>
              <Switch
                id='hasAttachment'
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
