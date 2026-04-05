'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '@/components/ui/combobox'
import { Controller, useFormContext } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'

export function ScheduleTriggerForm() {
  const { control, watch } = useFormContext()
  const loop = watch('loop')
  const selectedTimezone = watch('timezone')
  const localTimeZone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kathmandu'
      : 'Asia/Kathmandu'
  const timeZones = useMemo(() => {
    const fallback = [
      'UTC',
      'Asia/Kathmandu',
      'Asia/Kolkata',
      'Asia/Dubai',
      'Asia/Singapore',
      'Asia/Tokyo',
      'Europe/London',
      'Europe/Berlin',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Australia/Sydney'
    ]

    const base =
      typeof Intl !== 'undefined' &&
      typeof Intl.supportedValuesOf === 'function'
        ? Array.from(Intl.supportedValuesOf('timeZone'))
        : fallback

    return [localTimeZone, ...base.filter((zone) => zone !== localTimeZone)]
  }, [localTimeZone])

  const [timezoneSearch, setTimezoneSearch] = useState(
    selectedTimezone || localTimeZone
  )

  useEffect(() => {
    setTimezoneSearch(selectedTimezone || localTimeZone)
  }, [selectedTimezone, localTimeZone])

  const filteredTimeZones = useMemo(() => {
    const query = timezoneSearch.trim().toLowerCase()
    if (!query) return timeZones
    return timeZones.filter((zone) => zone.toLowerCase().includes(query))
  }, [timeZones, timezoneSearch])

  return (
    <div className='space-y-4'>
      <Controller
        name='date'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Start date</FieldLabel>
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              placeholder='Pick a start date'
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Choose the first day this workflow should run.
            </p>
          </Field>
        )}
      />

      <Controller
        name='time'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Run time</FieldLabel>
            <InputGroup>
              <InputGroupInput
                type='time'
                step={60}
                value={field.value || ''}
                onChange={field.onChange}
                className='text-sm appearance-none [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-70 [&::-webkit-datetime-edit]:text-foreground'
                style={{ accentColor: 'var(--primary)' }}
                aria-invalid={fieldState.invalid}
              />
            </InputGroup>
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Runs at the selected time in your chosen time zone.
            </p>
          </Field>
        )}
      />

      <Controller
        name='timezone'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>Time zone</FieldLabel>
            <Combobox
              value={field.value || localTimeZone}
              onValueChange={(value) => {
                if (!value) return
                field.onChange(value)
                setTimezoneSearch(value)
              }}
            >
              <ComboboxInput
                placeholder='Search time zone...'
                className='h-9 text-sm w-full'
                value={timezoneSearch}
                onChange={(e) => setTimezoneSearch(e.target.value)}
                aria-invalid={fieldState.invalid}
              />
              <ComboboxContent>
                <ComboboxList>
                  {filteredTimeZones.length === 0 ? (
                    <ComboboxEmpty>No time zones found</ComboboxEmpty>
                  ) : (
                    filteredTimeZones.map((zone) => (
                      <ComboboxItem
                        key={zone}
                        value={zone}
                        className='cursor-pointer py-2.5 px-3'
                      >
                        {zone}
                      </ComboboxItem>
                    ))
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name='loop'
        control={control}
        render={({ field }) => (
          <Field>
            <div className='flex items-center justify-between'>
              <FieldLabel className='text-xs font-medium'>
                Repeat daily
              </FieldLabel>
              <Switch
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {loop
                ? 'Repeats every day at the selected time.'
                : 'Runs only once at the selected date and time.'}
            </p>
          </Field>
        )}
      />
    </div>
  )
}
