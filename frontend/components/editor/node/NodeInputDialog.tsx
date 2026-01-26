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
  Info
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
          field.value?.length > 50
            ? `${field.value.substring(0, 50)}...`
            : field.value
        return (
          <span className='text-xs text-muted-foreground font-mono truncate max-w-[180px] block'>
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
          'flex items-center gap-2 p-2 rounded-md group',
          'hover:bg-muted/50 cursor-grab active:cursor-grabbing',
          'transition-all border border-transparent hover:border-border'
        )}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        <GripVertical className='h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0' />
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
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <div className='p-4 rounded-full bg-muted/50 mb-4'>
          <Braces className='h-8 w-8 text-muted-foreground' />
        </div>
        <div className='text-muted-foreground'>
          <p className='font-medium mb-1'>No inputs available</p>
          <p className='text-xs max-w-[200px]'>
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
        {availableInputs.map((source) => {
          const nodeType = source.nodeType as keyof typeof NODE_TYPES
          const nodeDef = NODE_DEFINITIONS[nodeType]
          const isExpanded = expandedNodes.has(source.nodeId)

          // Parse the output to get structured fields
          // We need to reconstruct the output from variables for parsing
          const reconstructedOutput: Record<string, any> = {}
          source.variables.forEach((v) => {
            // Simple reconstruction - just use path as key if it doesn't contain dots/brackets
            if (!v.path.includes('.') && !v.path.includes('[')) {
              reconstructedOutput[v.path] = v.value
            }
          })

          // Use parseNodeOutput for structured display
          const parsedOutput = parseNodeOutput(
            source.actionId,
            reconstructedOutput
          )

          return (
            <Collapsible
              key={source.nodeId}
              open={isExpanded}
              onOpenChange={() => toggleNode(source.nodeId)}
              className='border rounded-lg overflow-hidden'
            >
              <CollapsibleTrigger asChild>
                <div className='flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors'>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform shrink-0',
                      !isExpanded && '-rotate-90'
                    )}
                  />
                  {nodeDef?.icon && (
                    <Image
                      src={nodeDef.icon}
                      alt={nodeDef.label}
                      width={20}
                      height={20}
                      className='shrink-0'
                    />
                  )}
                  <div className='flex-1 min-w-0'>
                    <span className='text-sm font-medium block truncate'>
                      {nodeDef?.label || source.nodeType}
                    </span>
                    <span className='text-xs text-muted-foreground font-mono'>
                      {shortenNodeId(source.nodeId)}
                    </span>
                  </div>
                  <Badge variant='secondary' className='text-xs shrink-0'>
                    {source.variables.length}
                  </Badge>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className='p-2 space-y-1'>
                  {parsedOutput.fields.length > 0
                    ? // Use parsed structured fields if available
                      parsedOutput.fields.map((field) => (
                        <InputField
                          key={field.path}
                          field={field}
                          nodeId={source.nodeId}
                          onCopy={setCopiedPath}
                        />
                      ))
                    : // Fallback to flat variable list
                      source.variables.map((variable) => (
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

        {/* Tip for using placeholders */}
        <div className='mt-4 p-3 bg-muted/30 rounded-md'>
          <p className='text-xs text-muted-foreground'>
            <strong>Tip:</strong> Click or drag any field to use its placeholder
            in your configuration.
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}

export default NodeInputDialog
