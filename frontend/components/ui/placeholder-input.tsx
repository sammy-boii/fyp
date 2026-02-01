'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const PLACEHOLDER_REGEX = /(\{\{[^}]+\}\})/g

// Helper to render text with highlighted placeholders
function renderHighlightedText(text: string) {
  if (!text) return null

  const parts = text.split(PLACEHOLDER_REGEX)
  return parts.map((part, i) => {
    if (PLACEHOLDER_REGEX.test(part)) {
      // Reset regex lastIndex
      PLACEHOLDER_REGEX.lastIndex = 0
      return (
        <span
          key={i}
          className='text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 rounded px-0.5'
        >
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function PlaceholderInput({
  className,
  type,
  value,
  ...props
}: React.ComponentProps<'input'>) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const stringValue = typeof value === 'string' ? value : ''
  const hasPlaceholder = PLACEHOLDER_REGEX.test(stringValue)
  // Reset regex lastIndex after test
  PLACEHOLDER_REGEX.lastIndex = 0

  return (
    <div className='relative w-full'>
      {/* Overlay for highlighting - hidden when focused */}
      {hasPlaceholder && !isFocused && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center px-3 py-1 text-base md:text-sm overflow-hidden whitespace-nowrap',
            'rounded-md border border-transparent'
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {renderHighlightedText(stringValue)}
        </div>
      )}
      <input
        ref={inputRef}
        type={type}
        data-slot='input'
        value={value}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          // Make text transparent when overlay is visible
          hasPlaceholder && !isFocused && 'text-transparent caret-foreground',
          className
        )}
        {...props}
      />
    </div>
  )
}

function PlaceholderTextarea({
  className,
  value,
  ...props
}: React.ComponentProps<'textarea'>) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const stringValue = typeof value === 'string' ? value : ''
  const hasPlaceholder = PLACEHOLDER_REGEX.test(stringValue)
  // Reset regex lastIndex after test
  PLACEHOLDER_REGEX.lastIndex = 0

  return (
    <div className='relative w-full'>
      {/* Overlay for highlighting - hidden when focused */}
      {hasPlaceholder && !isFocused && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 px-3 py-2 text-base md:text-sm overflow-hidden whitespace-pre-wrap wrap-break-word',
            'rounded-md border border-transparent'
          )}
          onClick={() => textareaRef.current?.focus()}
        >
          {renderHighlightedText(stringValue)}
        </div>
      )}
      <textarea
        ref={textareaRef}
        data-slot='textarea'
        value={value}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        className={cn(
          'placeholder:text-muted-foreground dark:bg-input/30 border-input flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          // Make text transparent when overlay is visible
          hasPlaceholder && !isFocused && 'text-transparent caret-foreground',
          className
        )}
        {...props}
      />
    </div>
  )
}

export { PlaceholderInput, PlaceholderTextarea }
