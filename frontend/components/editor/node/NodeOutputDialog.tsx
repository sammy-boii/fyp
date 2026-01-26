'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Copy,
  Check,
  Clock,
  ChevronDown,
  ChevronRight,
  Info,
  Database,
  List,
  Braces
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NodeOutputData } from '@/lib/node-execution-store'
import { createPlaceholder } from '@/lib/placeholder-utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { parseNodeOutput, ParsedOutputField } from '@/lib/output-parser'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

type NodeOutputDialogProps = {
  output?: NodeOutputData
}

const OutputField = ({
  field,
  nodeId,
  depth = 0
}: {
  field: ParsedOutputField
  nodeId: string
  depth?: number
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [isExpanded, setIsExpanded] = React.useState(depth < 1)

  const handleCopyPlaceholder = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    const placeholder = createPlaceholder(nodeId, path)
    navigator.clipboard.writeText(placeholder)
    setCopiedKey(path)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const isCopied = copiedKey === field.path
  const hasChildren = field.children && field.children.length > 0

  const renderValueBadge = () => {
    switch (field.type) {
      case 'array':
        return (
          <Badge
            variant='secondary'
            className='text-[10px] font-mono px-1.5 py-0 h-5 gap-1'
          >
            <List className='h-3 w-3' />
            {field.arrayLength}
          </Badge>
        )
      case 'object':
        return (
          <Badge
            variant='secondary'
            className='text-[10px] font-mono px-1.5 py-0 h-5 gap-1'
          >
            <Braces className='h-3 w-3' />
          </Badge>
        )
      case 'null':
        return (
          <span className='text-muted-foreground/60 font-mono text-[10px]'>
            null
          </span>
        )
      case 'boolean':
        return (
          <span className='text-xs font-mono text-muted-foreground'>
            {String(field.value)}
          </span>
        )
      case 'number':
        return (
          <span className='font-mono text-xs text-muted-foreground'>
            {field.value}
          </span>
        )
      case 'string':
        const displayValue =
          field.value?.length > 40
            ? `${field.value.substring(0, 40)}...`
            : field.value
        return (
          <span className='text-xs text-muted-foreground font-mono truncate max-w-[180px] block'>
            "{displayValue}"
          </span>
        )
      default:
        return null
    }
  }

  if (!hasChildren) {
    // Leaf node - simple display
    return (
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md group',
          'hover:bg-accent/50 transition-all cursor-pointer',
          'border border-transparent hover:border-border/50'
        )}
        style={{ marginLeft: `${depth * 16}px` }}
        onClick={(e) => handleCopyPlaceholder(e, field.path)}
      >
        <div className='w-4 flex items-center justify-center'>
          <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground/30' />
        </div>
        <div className='flex-1 min-w-0 flex items-center gap-2'>
          <code className='text-xs font-medium text-foreground/80 font-mono'>
            {field.key}
          </code>
          {field.description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className='h-3 w-3 text-muted-foreground/50' />
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>{field.description}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {renderValueBadge()}
          {isCopied ? (
            <Check className='h-3.5 w-3.5 text-green-600 dark:text-green-500 shrink-0' />
          ) : (
            <Copy className='h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0' />
          )}
        </div>
      </div>
    )
  }

  // Expandable node with children
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer',
            'hover:bg-accent/50 transition-all group',
            'border border-transparent hover:border-border/50'
          )}
          style={{ marginLeft: `${depth * 16}px` }}
        >
          <div className='w-4 flex items-center justify-center'>
            {isExpanded ? (
              <ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
            ) : (
              <ChevronRight className='h-3.5 w-3.5 text-muted-foreground' />
            )}
          </div>
          <div className='flex-1 min-w-0 flex items-center gap-2'>
            <code className='text-xs font-medium text-foreground/80 font-mono'>
              {field.label || field.key}
            </code>
            {field.description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className='h-3 w-3 text-muted-foreground/50' />
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>{field.description}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {renderValueBadge()}
            <div
              onClick={(e) => handleCopyPlaceholder(e, field.path)}
              className='shrink-0'
            >
              {isCopied ? (
                <Check className='h-3.5 w-3.5 text-green-600 dark:text-green-500' />
              ) : (
                <Copy className='h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors' />
              )}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='border-l-2 border-border/30 ml-[23px] pl-1'>
          {field.children?.map((child) => (
            <OutputField
              key={child.path}
              field={child}
              nodeId={nodeId}
              depth={depth + 1}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const NodeOutputDialog = ({ output }: NodeOutputDialogProps) => {
  if (!output) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 mb-4 ring-1 ring-border/50'>
          <Clock className='h-8 w-8 text-muted-foreground/60' />
        </div>
        <div className='text-muted-foreground space-y-1'>
          <p className='font-medium'>No output yet</p>
          <p className='text-xs max-w-[220px] text-muted-foreground/70'>
            Execute this node to see its output here. The output will be
            available as input for subsequent nodes.
          </p>
        </div>
      </div>
    )
  }

  const parsedOutput = parseNodeOutput(output.actionId, output.output)

  return (
    <ScrollArea className='h-[calc(90vh-12rem)]'>
      <div className='space-y-4 pr-3'>
        {/* Header with summary */}
        <div className='flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-accent/30 to-transparent border border-border/50'>
          <div className='p-2 rounded-md bg-background shadow-sm ring-1 ring-border/50'>
            <Database className='h-4 w-4 text-muted-foreground' />
          </div>
          <div className='flex-1 min-w-0'>
            {parsedOutput.summary && (
              <p className='text-sm font-medium text-foreground truncate'>
                {parsedOutput.summary}
              </p>
            )}
            <p className='text-[10px] text-muted-foreground'>
              Last executed: {output.executedAt.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Output fields */}
        <div className='space-y-0.5 rounded-lg border border-border/50 p-2 bg-card/50'>
          {parsedOutput.fields.map((field) => (
            <OutputField
              key={field.path}
              field={field}
              nodeId={output.nodeId}
            />
          ))}
        </div>

        {/* Tip */}
        <div className='p-3 rounded-lg bg-muted/30 border border-dashed border-border/50'>
          <p className='text-[11px] text-muted-foreground leading-relaxed'>
            <span className='font-medium text-foreground/70'>Tip:</span> Click
            any field to copy its placeholder. Use{' '}
            <code className='font-mono text-[10px] px-1 py-0.5 rounded bg-muted'>
              {'{{nodeId.path}}'}
            </code>{' '}
            in subsequent nodes.
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}

export default NodeOutputDialog
