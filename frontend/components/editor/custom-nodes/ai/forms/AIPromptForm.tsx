'use client'

import { useFormContext, Controller } from 'react-hook-form'
import { Field, FieldLabel } from '@/components/ui/field'
import { PlaceholderTextarea } from '@/components/ui/placeholder-input'
import { Sparkles } from 'lucide-react'

export function AIPromptForm() {
  const { control } = useFormContext()

  return (
    <div className='space-y-4'>
      <Controller
        name='prompt'
        control={control}
        defaultValue=''
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel className='text-xs font-medium flex items-center gap-1.5'>
              <Sparkles className='h-3 w-3' />
              Prompt
            </FieldLabel>
            <PlaceholderTextarea
              placeholder='Enter your prompt here...'
              className='min-h-[120px] text-sm'
              {...field}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && (
              <p className='text-xs text-destructive mt-1'>
                {fieldState.error.message}
              </p>
            )}
          </Field>
        )}
      />

      <div className='rounded-md bg-muted/50 p-3 text-xs text-muted-foreground'>
        <p className='flex items-center gap-2 font-medium mb-1'>
          <Sparkles className='size-3' />
          Tips:
        </p>
        <ul className='list-disc list-inside space-y-0.5'>
          <li>Be specific and clear in your prompt</li>
          <li>The AI will return a structured JSON response</li>
        </ul>
      </div>
    </div>
  )
}
