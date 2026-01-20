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
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Controller, useFormContext } from 'react-hook-form'
import { useState } from 'react'
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
  const [showFilters, setShowFilters] = useState(false)

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

      {/* Show Filters Checkbox */}
      <div className='flex items-center space-x-2 pt-2'>
        <Checkbox
          id='show-filters'
          checked={showFilters}
          onCheckedChange={(checked) => setShowFilters(!!checked)}
        />
        <label
          htmlFor='show-filters'
          className='text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
        >
          Advanced Filters
        </label>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className='space-y-4 pt-2'>
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

          {/* Date Range */}
          <div className='grid grid-cols-2 gap-3'>
            {/* After Date */}
            <Controller
              name='after'
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-xs font-medium'>After</FieldLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder='Select date'
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
                  <FieldLabel className='text-xs font-medium'>
                    Before
                  </FieldLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder='Select date'
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
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
      )}
    </div>
  )
}
