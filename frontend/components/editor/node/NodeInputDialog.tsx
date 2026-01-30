'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Copy,
  Check,
  Braces,
  Info,
  Workflow,
  List
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_DEFINITIONS } from '@/constants/registry'
import { NODE_TYPES } from '@/constants'
import { createPlaceholder } from '@/lib/placeholder-utils'
import { NodeInputSource } from '@/lib/node-execution-store'
import { parseNodeOutput, ParsedOutputField } from '@/lib/output-parser'
import Image from 'next/image'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

type NodeInputDialogProps = {
  availableInputs: NodeInputSource[]
}

// Recursive component to render input fields with collapsible arrays/objects
const InputField = ({
  field,
  nodeId,
  depth = 0,
  onCopy
}: {
  field: ParsedOutputField
  nodeId: string
  depth?: number
  onCopy: (path: string) => void
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [isExpanded, setIsExpanded] = React.useState(depth < 1)

  const handleCopyPlaceholder = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    const placeholder = createPlaceholder(nodeId, path)
    navigator.clipboard.writeText(placeholder)
    setCopiedKey(path)
    onCopy(`${nodeId}.${path}`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    path: string
  ) => {
    const placeholder = createPlaceholder(nodeId, path)
    e.dataTransfer.setData('text/plain', placeholder)
    e.dataTransfer.effectAllowed = 'copy'
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
          field.value?.length > 35
            ? `${field.value.substring(0, 35)}...`
            : field.value
        return (
          <span className='text-xs text-muted-foreground font-mono truncate max-w-[150px] block'>
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
        draggable
        onDragStart={(e) => handleDragStart(e, field.path)}
        onClick={(e) => handleCopyPlaceholder(e, field.path)}
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md group',
          'hover:bg-accent/50 cursor-grab active:cursor-grabbing',
          'transition-all border border-transparent hover:border-border/50'
        )}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <GripVertical className='h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0' />
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
            <InputField
              key={child.path}
              field={child}
              nodeId={nodeId}
              depth={depth + 1}
              onCopy={onCopy}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const NodeInputDialog = ({ availableInputs }: NodeInputDialogProps) => {
  const [, setCopiedPath] = React.useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(
    () => new Set(availableInputs.map((i) => i.nodeId)) // Expand all by default
  )

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  // Shorten node ID for display
  const shortenNodeId = (nodeId: string) => {
    if (nodeId.length > 12) {
      return nodeId.substring(0, 8) + '...'
    }
    return nodeId
  }

  if (availableInputs.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='p-4 rounded-xl bg-linear-to-br from-muted/50 to-muted/30 mb-4 ring-1 ring-border/50'>
          <Braces className='h-8 w-8 text-muted-foreground/60' />
        </div>
        <div className='text-muted-foreground space-y-1'>
          <p className='font-medium'>No inputs available</p>
          <p className='text-xs max-w-[220px] text-muted-foreground/70'>
            Execute previous nodes in the workflow to see their outputs here as
            available inputs
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className='h-[calc(90vh-12rem)]'>
      <div className='space-y-4 pr-3'>
        {/* Header */}
        <div className='flex items-center gap-3 p-3 rounded-lg bg-linear-to-r from-accent/30 to-transparent border border-border/50'>
          <div className='p-2 rounded-md bg-background shadow-sm ring-1 ring-border/50'>
            <Workflow className='h-4 w-4 text-muted-foreground' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-foreground'>
              Available Inputs
            </p>
            <p className='text-[10px] text-muted-foreground'>
              {availableInputs.length} source node
              {availableInputs.length > 1 ? 's' : ''} with data
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className='flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors'>
                <Info className='h-3.5 w-3.5' />
              </button>
            </TooltipTrigger>
            <TooltipContent side='bottom' className='max-w-64'>
              <p className='text-xs'>
                Click or drag any field to use its placeholder in your
                configuration.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {availableInputs.map((source) => {
          const nodeType = source.nodeType as keyof typeof NODE_TYPES
          const nodeDef = NODE_DEFINITIONS[nodeType]
          const isExpanded = expandedNodes.has(source.nodeId)

          // Use rawOutput if available, otherwise fall back to reconstruction
          const outputForParsing = source.rawOutput || {}

          // Use parseNodeOutput for structured display
          const parsedOutput = parseNodeOutput(
            source.actionId,
            outputForParsing
          )

          return (
            <Collapsible
              key={source.nodeId}
              open={isExpanded}
              onOpenChange={() => toggleNode(source.nodeId)}
              className='rounded-lg border border-border/50 overflow-hidden bg-card/50'
            >
              <CollapsibleTrigger asChild>
                <div className='flex items-center gap-3 p-3 hover:bg-accent/30 cursor-pointer transition-colors'>
                  <div className='w-5 flex items-center justify-center'>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform',
                        !isExpanded && '-rotate-90'
                      )}
                    />
                  </div>
                  {nodeDef?.icon && (
                    <div className='p-1.5 rounded-md bg-background shadow-sm ring-1 ring-border/50'>
                      <Image
                        src={nodeDef.icon}
                        alt={nodeDef.label}
                        width={16}
                        height={16}
                      />
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <span className='text-sm font-medium block truncate'>
                      {nodeDef?.label || source.nodeType}
                    </span>
                    <span className='text-[10px] text-muted-foreground font-mono'>
                      {shortenNodeId(source.nodeId)}
                    </span>
                  </div>
                  <Badge
                    variant='secondary'
                    className='text-[10px] shrink-0 h-5'
                  >
                    {source.variables.length} fields
                  </Badge>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className='px-2 pb-2 space-y-0.5 border-t border-border/30 pt-2'>
                  {parsedOutput.fields.length > 0
                    ? parsedOutput.fields.map((field) => (
                        <InputField
                          key={field.path}
                          field={field}
                          nodeId={source.nodeId}
                          onCopy={setCopiedPath}
                        />
                      ))
                    : source.variables.map((variable) => (
                        <InputField
                          key={variable.path}
                          field={{
                            key: variable.path,
                            label: variable.path,
                            value: variable.value,
                            path: variable.path,
                            type:
                              typeof variable.value === 'string'
                                ? 'string'
                                : typeof variable.value === 'number'
                                  ? 'number'
                                  : typeof variable.value === 'boolean'
                                    ? 'boolean'
                                    : variable.value === null
                                      ? 'null'
                                      : Array.isArray(variable.value)
                                        ? 'array'
                                        : 'object',
                            isExpandable: false
                          }}
                          nodeId={source.nodeId}
                          onCopy={setCopiedPath}
                        />
                      ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export default NodeInputDialog
