'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, Check, Clock, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NodeOutputData } from '@/lib/node-execution-store'
import { createPlaceholder } from '@/lib/placeholder-utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'

type NodeOutputDialogProps = {
  output?: NodeOutputData
}

const NodeOutputDialog = ({ output }: NodeOutputDialogProps) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(
    () => new Set(output ? Object.keys(output.output) : [])
  )

  const handleCopyPlaceholder = (key: string) => {
    if (output) {
      const placeholder = createPlaceholder(output.nodeId, key)
      navigator.clipboard.writeText(placeholder)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
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

  const renderValue = (value: any): React.ReactNode => {
    if (value === null)
      return <span className='text-orange-500 font-mono text-xs'>null</span>
    if (value === undefined)
      return (
        <span className='text-orange-500 font-mono text-xs'>undefined</span>
      )

    if (typeof value === 'boolean') {
      return (
        <span
          className={cn(
            'text-xs font-mono',
            value ? 'text-green-600' : 'text-muted-foreground'
          )}
        >
          {String(value)}
        </span>
      )
    }

    if (typeof value === 'number') {
      return <span className='text-blue-500 font-mono text-xs'>{value}</span>
    }

    if (typeof value === 'string') {
      if (value.length > 100) {
        return (
          <span className='text-xs text-foreground font-mono break-all'>
            {value.substring(0, 100)}...
          </span>
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
        <span className='text-xs text-muted-foreground font-mono'>
          Array [{value.length}]
        </span>
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
      return (
        <span className='text-xs text-muted-foreground font-mono'>
          Object {'{'}...{'}'}
        </span>
      )
    }

    return <span className='text-xs font-mono'>{String(value)}</span>
  }

  const outputEntries = Object.entries(output.output)

  return (
    <ScrollArea className='h-[calc(90vh-12rem)]'>
      <div className='space-y-4 pr-3'>
        {/* Last executed timestamp - subtle, in corner style */}
        <div className='text-xs text-muted-foreground text-right'>
          Last executed: {output.executedAt.toLocaleTimeString()}
        </div>

        {outputEntries.map(([key, value]) => {
          const isExpanded = expandedKeys.has(key)
          const isCopied = copiedKey === key

          return (
            <Collapsible
              key={key}
              open={isExpanded}
              onOpenChange={() => toggleKey(key)}
              className='border rounded-lg overflow-hidden'
            >
              <CollapsibleTrigger asChild>
                <div className='flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors'>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform shrink-0',
                      isExpanded && 'rotate-180'
                    )}
                  />
                  <div className='flex-1 min-w-0'>
                    <code className='text-sm font-semibold text-primary font-mono'>
                      {key}
                    </code>
                    {!isExpanded && (
                      <p className='text-xs text-muted-foreground truncate mt-0.5'>
                        {renderValue(value)}
                      </p>
                    )}
                  </div>
                  <div
                    className='shrink-0'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyPlaceholder(key)
                    }}
                  >
                    {isCopied ? (
                      <Check className='h-4 w-4 text-green-500' />
                    ) : (
                      <Copy className='h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors' />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className='p-3 text-xs font-mono bg-muted/20 max-h-48 overflow-auto'>
                  <pre className='whitespace-pre-wrap break-all'>
                    {typeof value === 'object'
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export default NodeOutputDialog
