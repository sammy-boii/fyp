'use client'

import { Controller, useFormContext } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function ListGuildsForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='limit'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className='text-xs font-medium'>
              Limit (Optional)
            </FieldLabel>
            <Input
              type='number'
              placeholder='100'
              className='h-9 text-sm'
              {...field}
              onChange={(e) =>
                field.onChange(e.target.valueAsNumber || undefined)
              }
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
            <p className='text-xs text-muted-foreground mt-1'>
              Maximum number of servers to return (default: 100)
            </p>
          </Field>
        )}
      />

      <div className='rounded-md bg-muted/50 p-3 text-xs text-muted-foreground'>
        <p className='font-medium text-foreground mb-1'>Note:</p>
        <p>
          This action returns all servers (guilds) that your Discord bot has
          been added to. Make sure your bot has the necessary permissions.
        </p>
      </div>
    </div>
  )
}
