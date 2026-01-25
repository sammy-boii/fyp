'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { ChevronDown, GripVertical, Copy, Check, Braces } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_DEFINITIONS } from '@/constants/registry'
import { NODE_TYPES } from '@/constants'
import {
  createPlaceholder,
  formatValueForDisplay
} from '@/lib/placeholder-utils'
import { NodeInputSource } from '@/lib/node-execution-store'
import Image from 'next/image'

type NodeInputDialogProps = {
  availableInputs: NodeInputSource[]
}

const NodeInputDialog = ({ availableInputs }: NodeInputDialogProps) => {
  const [copiedPath, setCopiedPath] = React.useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(
    () => new Set(availableInputs.map((i) => i.nodeId)) // Expand all by default
  )

  const handleCopyPlaceholder = (nodeId: string, path: string) => {
    const placeholder = createPlaceholder(nodeId, path)
    navigator.clipboard.writeText(placeholder)
    setCopiedPath(`${nodeId}.${path}`)
    setTimeout(() => setCopiedPath(null), 2000)
  }

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    nodeId: string,
    path: string
  ) => {
    const placeholder = createPlaceholder(nodeId, path)
    e.dataTransfer.setData('text/plain', placeholder)
    e.dataTransfer.effectAllowed = 'copy'
  }

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
        {/* Instructions */}
        <div className='bg-primary/5 border border-primary/20 rounded-lg p-3'>
          <p className='text-xs text-muted-foreground'>
            <span className='font-medium text-foreground'>Tip:</span> Click on a
            variable to copy its placeholder, or drag it into a form field.
          </p>
        </div>

        {availableInputs.map((source) => {
          const nodeType = source.nodeType as keyof typeof NODE_TYPES
          const nodeDef = NODE_DEFINITIONS[nodeType]
          const isExpanded = expandedNodes.has(source.nodeId)

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
                      isExpanded && 'rotate-180'
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
                  <Badge
                    variant='secondary'
                    className='text-xs shrink-0 bg-primary/10 text-primary'
                  >
                    {source.variables.length}
                  </Badge>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className='p-2 space-y-1 bg-background'>
                  {source.variables.map((variable) => {
                    const fullPath = `${source.nodeId}.${variable.path}`
                    const isCopied = copiedPath === fullPath

                    return (
                      <TooltipProvider key={variable.path} delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(e, source.nodeId, variable.path)
                              }
                              onClick={() =>
                                handleCopyPlaceholder(
                                  source.nodeId,
                                  variable.path
                                )
                              }
                              className={cn(
                                'flex items-center gap-2 p-2 rounded-md',
                                'hover:bg-primary/5 cursor-grab active:cursor-grabbing',
                                'transition-all group border border-transparent',
                                'hover:border-primary/20'
                              )}
                            >
                              <GripVertical className='h-3 w-3 text-muted-foreground/50 group-hover:text-primary/50 transition-colors shrink-0' />

                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2'>
                                  <code className='text-xs font-semibold text-primary font-mono truncate'>
                                    {variable.path}
                                  </code>
                                </div>
                                <p className='text-xs text-muted-foreground truncate mt-0.5'>
                                  {formatValueForDisplay(variable.value)}
                                </p>
                              </div>

                              <div className='shrink-0'>
                                {isCopied ? (
                                  <Check className='h-4 w-4 text-green-500' />
                                ) : (
                                  <Copy className='h-4 w-4 text-muted-foreground/50 group-hover:text-primary/70 transition-colors' />
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side='left'
                            className='max-w-xs bg-popover'
                          >
                            <div className='space-y-2'>
                              <p className='text-xs text-muted-foreground'>
                                Click to copy placeholder:
                              </p>
                              <code className='block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-mono break-all'>
                                {createPlaceholder(
                                  source.nodeId,
                                  variable.path
                                )}
                              </code>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
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
