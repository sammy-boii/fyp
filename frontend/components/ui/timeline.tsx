'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const timelineVariants = cva('flex flex-col relative', {
  variants: {
    size: {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6'
    }
  },
  defaultVariants: {
    size: 'md'
  }
})

interface TimelineProps
  extends
    React.HTMLAttributes<HTMLOListElement>,
    VariantProps<typeof timelineVariants> {}

const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(
  ({ className, size, children, ...props }, ref) => {
    return (
      <ol
        ref={ref}
        aria-label='Timeline'
        className={cn(timelineVariants({ size }), className)}
        {...props}
      >
        {children}
      </ol>
    )
  }
)
Timeline.displayName = 'Timeline'

interface TimelineItemProps extends React.HTMLAttributes<HTMLLIElement> {
  status?: 'completed' | 'in-progress' | 'pending' | 'error'
  showConnector?: boolean
}

const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <li ref={ref} className={cn('relative flex gap-3', className)} {...props}>
        {children}
      </li>
    )
  }
)
TimelineItem.displayName = 'TimelineItem'

interface TimelineDotProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: 'completed' | 'in-progress' | 'pending' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

const TimelineDot = React.forwardRef<HTMLDivElement, TimelineDotProps>(
  (
    { className, status = 'completed', size = 'md', children, ...props },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-6 w-6',
      md: 'h-8 w-8',
      lg: 'h-10 w-10'
    }

    const iconSizeClasses = {
      sm: '[&>svg]:h-3 [&>svg]:w-3',
      md: '[&>svg]:h-4 [&>svg]:w-4',
      lg: '[&>svg]:h-5 [&>svg]:w-5'
    }

    const statusClasses = {
      completed: 'bg-primary text-primary-foreground',
      'in-progress': 'bg-primary/20 text-primary border-2 border-primary',
      pending: 'bg-muted text-muted-foreground',
      error: 'bg-destructive text-destructive-foreground'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative z-10 flex items-center justify-center rounded-full shrink-0',
          sizeClasses[size],
          iconSizeClasses[size],
          statusClasses[status],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TimelineDot.displayName = 'TimelineDot'

interface TimelineConnectorProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: 'completed' | 'in-progress' | 'pending' | 'error'
}

const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  TimelineConnectorProps
>(({ className, status = 'completed', ...props }, ref) => {
  const statusClasses = {
    completed: 'bg-primary',
    'in-progress': 'bg-gradient-to-b from-primary to-muted',
    pending: 'bg-muted',
    error: 'bg-destructive'
  }

  return (
    <div
      ref={ref}
      className={cn(
        'absolute left-4 top-8 bottom-0 w-0.5 -translate-x-1/2',
        statusClasses[status],
        className
      )}
      {...props}
    />
  )
})
TimelineConnector.displayName = 'TimelineConnector'

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1 pb-2 flex-1 min-w-0', className)}
    {...props}
  />
))
TimelineContent.displayName = 'TimelineContent'

const TimelineTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h4
    ref={ref}
    className={cn('text-sm font-medium leading-none', className)}
    {...props}
  >
    {children}
  </h4>
))
TimelineTitle.displayName = 'TimelineTitle'

const TimelineDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-muted-foreground', className)}
    {...props}
  />
))
TimelineDescription.displayName = 'TimelineDescription'

const TimelineTime = React.forwardRef<
  HTMLTimeElement,
  React.HTMLAttributes<HTMLTimeElement> & { date?: string | Date }
>(({ className, date, children, ...props }, ref) => (
  <time
    ref={ref}
    dateTime={date ? new Date(date).toISOString() : undefined}
    className={cn('text-xs text-muted-foreground font-mono', className)}
    {...props}
  >
    {children}
  </time>
))
TimelineTime.displayName = 'TimelineTime'

export {
  Timeline,
  TimelineItem,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineTitle,
  TimelineDescription,
  TimelineTime
}
