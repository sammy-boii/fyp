'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Copy,
  Check,
  Clock,
  CheckCircle2,
  FileJson,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NodeOutputData } from '@/lib/node-execution-store'
import { createPlaceholder } from '@/lib/placeholder-utils'

type NodeOutputDialogProps = {
  output?: NodeOutputData
}

const NodeOutputDialog = ({ output }: NodeOutputDialogProps) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

  const handleCopyValue = (key: string, value: any) => {
    const textValue =
      typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    navigator.clipboard.writeText(textValue)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleCopyPlaceholder = (key: string) => {
    if (output) {
      const placeholder = createPlaceholder(output.nodeId, key)
      navigator.clipboard.writeText(placeholder)
      setCopiedKey(`placeholder-${key}`)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  const handleCopyAll = () => {
    if (output?.output) {
      navigator.clipboard.writeText(JSON.stringify(output.output, null, 2))
      setCopiedKey('__all__')
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  if (!output) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <div className='p-4 rounded-full bg-muted/50 mb-4'>
          <Clock className='h-8 w-8 text-muted-foreground' />
        </div>
        <div className='text-muted-foreground'>
          <p className='font-medium mb-1'>No output yet</p>
          <p className='text-xs max-w-[200px]'>
            Execute this node to see its output here. The output will be
            available as input for subsequent nodes.
          </p>
        </div>
      </div>
    )
  }

  const renderValue = (
    value: any,
    path: string,
    depth = 0
  ): React.ReactNode => {
    if (value === null)
      return <span className='text-orange-500 font-mono text-xs'>null</span>
    if (value === undefined)
      return (
        <span className='text-orange-500 font-mono text-xs'>undefined</span>
      )

    if (typeof value === 'boolean') {
      return (
        <Badge
          variant={value ? 'default' : 'secondary'}
          className={cn(
            'text-xs font-mono',
            value && 'bg-green-500/20 text-green-600'
          )}
        >
          {String(value)}
        </Badge>
      )
    }

    if (typeof value === 'number') {
      return (
        <span className='text-blue-500 font-mono text-xs font-medium'>
          {value}
        </span>
      )
    }

    if (typeof value === 'string') {
      // Highlight placeholders in the string
      const placeholderRegex = /\{\{([^}]+)\}\}/g
      const parts = value.split(placeholderRegex)

      if (parts.length > 1) {
        // String contains placeholders
        return (
          <div className='text-xs text-foreground bg-muted/30 p-2 rounded mt-1 break-all max-h-32 overflow-y-auto font-mono'>
            {value.split(/(\{\{[^}]+\}\})/).map((part, i) => {
              if (part.match(/^\{\{[^}]+\}\}$/)) {
                return (
                  <span
                    key={i}
                    className='bg-primary/20 text-primary px-1 py-0.5 rounded font-semibold'
                  >
                    {part}
                  </span>
                )
              }
              return <span key={i}>{part}</span>
            })}
          </div>
        )
      }

      if (value.length > 150) {
        return (
          <div className='text-xs text-foreground bg-muted/30 p-2 rounded mt-1 break-all max-h-32 overflow-y-auto'>
            {value}
          </div>
        )
      }
      return <span className='text-xs text-foreground font-mono'>{value}</span>
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return (
          <span className='text-muted-foreground text-xs font-mono'>[]</span>
        )
      }
      return (
        <div className='mt-1 space-y-1'>
          <Badge
            variant='outline'
            className='text-xs bg-blue-500/10 text-blue-600 border-blue-500/20'
          >
            Array [{value.length}]
          </Badge>
          {depth < 2 && (
            <div className='pl-3 border-l-2 border-blue-500/20 space-y-2 mt-2'>
              {value.slice(0, 3).map((item, index) => (
                <div key={index} className='text-xs'>
                  <span className='text-blue-500 font-mono'>[{index}]</span>
                  <ChevronRight className='inline h-3 w-3 mx-1 text-muted-foreground' />
                  {renderValue(item, `${path}[${index}]`, depth + 1)}
                </div>
              ))}
              {value.length > 3 && (
                <p className='text-xs text-muted-foreground italic'>
                  ...and {value.length - 3} more items
                </p>
              )}
            </div>
          )}
        </div>
      )
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value)
      if (entries.length === 0) {
        return (
          <span className='text-muted-foreground text-xs font-mono'>
            {'{}'}
          </span>
        )
      }

      if (depth >= 2) {
        return (
          <Badge
            variant='outline'
            className='text-xs bg-purple-500/10 text-purple-600 border-purple-500/20'
          >
            Object
          </Badge>
        )
      }

      return (
        <div className='pl-3 border-l-2 border-purple-500/20 space-y-2 mt-1'>
          {entries.slice(0, 8).map(([key, val]) => (
            <div key={key} className='text-xs'>
              <span className='font-medium text-purple-600 font-mono'>
                {key}
              </span>
              <ChevronRight className='inline h-3 w-3 mx-1 text-muted-foreground' />
              {renderValue(val, `${path}.${key}`, depth + 1)}
            </div>
          ))}
          {entries.length > 8 && (
            <p className='text-xs text-muted-foreground italic'>
              ...and {entries.length - 8} more properties
            </p>
          )}
        </div>
      )
    }

    return <span className='text-xs font-mono'>{String(value)}</span>
  }

  return (
    <ScrollArea className='h-[calc(90vh-12rem)]'>
      <div className='space-y-4 pr-3'>
        {/* Header with status and timestamp */}
        <div className='flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-3'>
          <div className='flex items-center gap-2'>
            <CheckCircle2 className='h-4 w-4 text-green-500' />
            <span className='text-xs text-muted-foreground'>
              Last executed:{' '}
              <span className='text-foreground font-medium'>
                {output.executedAt.toLocaleTimeString()}
              </span>
            </span>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='h-7 text-xs hover:bg-green-500/10'
            onClick={handleCopyAll}
          >
            {copiedKey === '__all__' ? (
              <>
                <Check className='h-3 w-3 mr-1 text-green-500' />
                Copied!
              </>
            ) : (
              <>
                <FileJson className='h-3 w-3 mr-1' />
                Copy JSON
              </>
            )}
          </Button>
        </div>

        {/* Output data */}
        <div className='space-y-3'>
          {Object.entries(output.output).map(([key, value]) => (
            <div
              key={key}
              className={cn(
                'p-3 rounded-lg border bg-card',
                'hover:border-primary/30 transition-colors'
              )}
            >
              <div className='flex items-center justify-between gap-2 mb-2'>
                <code className='text-sm font-semibold text-primary font-mono'>
                  {key}
                </code>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-6 px-2 text-xs'
                    onClick={() => handleCopyPlaceholder(key)}
                  >
                    {copiedKey === `placeholder-${key}` ? (
                      <>
                        <Check className='h-3 w-3 mr-1 text-green-500' />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className='h-3 w-3 mr-1' />
                        Placeholder
                      </>
                    )}
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 shrink-0'
                    onClick={() => handleCopyValue(key, value)}
                  >
                    {copiedKey === key ? (
                      <Check className='h-3 w-3 text-green-500' />
                    ) : (
                      <Copy className='h-3 w-3' />
                    )}
                  </Button>
                </div>
              </div>
              <div>{renderValue(value, key)}</div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

export default NodeOutputDialog
