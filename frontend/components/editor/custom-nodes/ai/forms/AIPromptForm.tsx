'use client'

import type { FormEvent } from 'react'
import { useFieldArray, useFormContext, Controller } from 'react-hook-form'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  PlaceholderInput,
  PlaceholderTextarea
} from '@/components/ui/placeholder-input'
import { Sparkles, SlidersHorizontal, Braces, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AIPromptForm() {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customFields'
  })

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

      <Controller
        name='systemPrompt'
        control={control}
        defaultValue=''
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel className='text-xs font-medium flex items-center gap-1.5'>
              <SlidersHorizontal className='h-3 w-3' />
              System Prompt (Optional)
            </FieldLabel>
            <PlaceholderTextarea
              placeholder='Add extra instruction rules for this node...'
              className='min-h-[100px] text-sm'
              {...field}
              value={field.value ?? ''}
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

      <div className='space-y-2'>
        <FieldLabel className='text-xs font-medium flex items-center gap-1.5'>
          <Braces className='h-3 w-3' />
          Custom Fields
        </FieldLabel>

        {fields.length === 0 && (
          <div className='rounded-md border border-dashed p-2.5 text-[11px] text-muted-foreground'>
            No custom fields yet. Add fields to force AI output under{' '}
            <span className='font-medium'>custom_fields</span>.
          </div>
        )}

        <div className='space-y-3'>
          {fields.map((item, index) => (
            <div
              key={item.id}
              className='grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2rem] items-start gap-2'
            >
              <Controller
                name={`customFields.${index}.key`}
                control={control}
                render={({ field, fieldState }) => (
                  <PlaceholderTextarea
                    placeholder='field_name'
                    className='min-h-9 h-9 max-h-40 w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap wrap-break-word text-xs leading-4'
                    {...field}
                    value={field.value ?? ''}
                    onInput={(e: FormEvent<HTMLDivElement>) => {
                      const target = e.currentTarget
                      target.style.height = '2.25rem'
                      target.style.height = `${target.scrollHeight}px`
                    }}
                    aria-invalid={fieldState.invalid}
                  />
                )}
              />

              <Controller
                name={`customFields.${index}.value`}
                control={control}
                render={({ field }) => (
                  <PlaceholderTextarea
                    placeholder='value'
                    className='min-h-9 h-9 max-h-40 w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap wrap-break-word text-xs leading-4'
                    {...field}
                    value={field.value ?? ''}
                    onInput={(e: FormEvent<HTMLDivElement>) => {
                      const target = e.currentTarget
                      target.style.height = '2.25rem'
                      target.style.height = `${target.scrollHeight}px`
                    }}
                  />
                )}
              />

              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-9 w-9 shrink-0'
                onClick={() => remove(index)}
              >
                <Trash2 className='h-3 w-3 text-muted-foreground' />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type='button'
          variant='outline'
          size='sm'
          className='w-full h-7 text-xs mt-2'
          onClick={() => append({ key: '', value: '' })}
        >
          <Plus className='h-3 w-3 mr-1' />
          Add Custom Field
        </Button>
      </div>

      <div className='rounded-md bg-muted/50 p-3 text-xs text-muted-foreground'>
        <p className='flex items-center gap-2 font-medium mb-1'>
          <Sparkles className='size-3' />
          Tips:
        </p>
        <ul className='list-disc list-inside space-y-0.5'>
          <li>Be specific and clear in your prompt</li>
          <li>
            Use system prompt to enforce tone, role, or strict constraints
          </li>
          <li>
            Custom fields are returned in custom_fields for downstream nodes
          </li>
        </ul>
      </div>
    </div>
  )
}
