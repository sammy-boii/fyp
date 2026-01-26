'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const PLACEHOLDER_REGEX = /\{\{[^}]+\}\}/

function PlaceholderInput({
  className,
  type,
  value,
  ...props
}: React.ComponentProps<'input'>) {
  const hasPlaceholder =
    typeof value === 'string' && PLACEHOLDER_REGEX.test(value)

  return (
    <input
      type={type}
      data-slot='input'
      value={value}
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        hasPlaceholder &&
          'bg-green-50 dark:bg-green-950/30 text-primary border-green-200 dark:border-green-800/50',
        className
      )}
      {...props}
    />
  )
}

function PlaceholderTextarea({
  className,
  value,
  ...props
}: React.ComponentProps<'textarea'>) {
  const hasPlaceholder =
    typeof value === 'string' && PLACEHOLDER_REGEX.test(value)

  return (
    <textarea
      data-slot='textarea'
      value={value}
      className={cn(
        'placeholder:text-muted-foreground dark:bg-input/30 border-input flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        hasPlaceholder &&
          'bg-green-50 dark:bg-green-950/30 text-primary border-green-200 dark:border-green-800/50',
        className
      )}
      {...props}
    />
  )
}

export { PlaceholderInput, PlaceholderTextarea }
