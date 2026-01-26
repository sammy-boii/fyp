'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Copy,
  Check,
  Clock,
  ChevronDown,
  ChevronRight,
  Info
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
          <Badge variant='secondary' className='text-xs font-mono'>
            [{field.arrayLength}]
          </Badge>
        )
      case 'object':
        return (
          <Badge variant='secondary' className='text-xs font-mono'>
            {'{...}'}
          </Badge>
        )
      case 'null':
        return <span className='text-orange-500 font-mono text-xs'>null</span>
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
          field.value?.length > 60
            ? `${field.value.substring(0, 60)}...`
            : field.value
        return (
          <span className='text-xs text-foreground font-mono truncate max-w-[200px] block'>
            {displayValue}
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
          'flex items-center gap-2 p-2 rounded-md group',
          'hover:bg-muted/50 transition-colors cursor-pointer'
        )}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
        onClick={(e) => handleCopyPlaceholder(e, field.path)}
      >
        <div className='w-4' /> {/* Spacer for alignment */}
        <div className='flex-1 min-w-0 flex items-center gap-2'>
          <code className='text-xs font-semibold text-foreground font-mono'>
            {field.key}
          </code>
          {field.description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className='h-3 w-3 text-muted-foreground' />
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
            <Check className='h-4 w-4 text-green-500 shrink-0' />
          ) : (
            <Copy className='h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0' />
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
            'flex items-center gap-2 p-2 rounded-md cursor-pointer',
            'hover:bg-muted/50 transition-colors group'
          )}
          style={{ paddingLeft: `${(depth + 1) * 12}px` }}
        >
          {isExpanded ? (
            <ChevronDown className='h-4 w-4 text-muted-foreground shrink-0' />
          ) : (
            <ChevronRight className='h-4 w-4 text-muted-foreground shrink-0' />
          )}
          <div className='flex-1 min-w-0 flex items-center gap-2'>
            <code className='text-xs font-semibold text-foreground font-mono'>
              {field.label || field.key}
            </code>
            {field.description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className='h-3 w-3 text-muted-foreground' />
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
                <Check className='h-4 w-4 text-green-500' />
              ) : (
                <Copy className='h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors' />
              )}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='border-l border-border/50 ml-4'>
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

  const parsedOutput = parseNodeOutput(output.actionId, output.output)

  return (
    <ScrollArea className='h-[calc(90vh-12rem)]'>
      <div className='space-y-3 pr-3'>
        {/* Summary and timestamp */}
        <div className='flex items-center justify-between text-xs text-muted-foreground pb-2 border-b'>
          {parsedOutput.summary && (
            <span className='font-medium text-foreground'>
              {parsedOutput.summary}
            </span>
          )}
          <span>Last executed: {output.executedAt.toLocaleTimeString()}</span>
        </div>

        {/* Output fields */}
        <div className='space-y-1'>
          {parsedOutput.fields.map((field) => (
            <OutputField
              key={field.path}
              field={field}
              nodeId={output.nodeId}
            />
          ))}
        </div>

        {/* Tip for using placeholders */}
        <div className='mt-4 p-3 bg-muted/30 rounded-md'>
          <p className='text-xs text-muted-foreground'>
            <strong>Tip:</strong> Click on any field to copy its placeholder.
            Use placeholders like{' '}
            <code className='font-mono'>{'{{nodeId.path}}'}</code> in subsequent
            nodes to reference these values.
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}

export default NodeOutputDialog
