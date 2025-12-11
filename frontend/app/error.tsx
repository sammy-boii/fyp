'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className='flex min-h-screen w-screen items-center justify-center bg-background px-6 py-12'>
      <div className='w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive'>
            <AlertTriangle className='h-7 w-7' />
          </div>
          <div className='space-y-2'>
            <h1 className='text-2xl font-semibold'>
              Oops, something went wrong
            </h1>
            <p className='text-sm text-muted-foreground'>
              {error?.message ||
                'An unexpected error occurred. Please try again.'}
            </p>
            {error?.digest ? (
              <p className='text-xs text-muted-foreground/80'>
                Error ID: {error.digest}
              </p>
            ) : null}
          </div>
          <Button onClick={reset} className='gap-2'>
            <RefreshCw className='h-4 w-4' />
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
