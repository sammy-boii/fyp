'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import { Controller, useFormContext } from 'react-hook-form'
import { Clock } from 'lucide-react'

export function ScheduleTriggerForm() {
  const { control, watch } = useFormContext()
  const loop = watch('loop')

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
              <InputGroupAddon align='inline-start'>
                <Clock className='h-4 w-4' />
              </InputGroupAddon>
              <InputGroupInput
                type='time'
                step={60}
                value={field.value || ''}
                onChange={field.onChange}
                aria-invalid={fieldState.invalid}
              />
            </InputGroup>
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              This uses your server time zone.
            </p>
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
