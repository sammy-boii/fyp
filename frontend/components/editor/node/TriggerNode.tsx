'use client'

import {
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  addEdge,
  useStore
} from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Check, Play, Settings, RefreshCw, Plus, X } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback } from 'react'
import { BaseNodeProps } from '@/types/node.types'
import { TRIGGER_NODE_DEFINITIONS } from '@/constants/registry'
import { cn } from '@/lib/utils'
import { useExecuteNode } from '@/hooks/use-workflows'
import {
  getAvailableInputsFromNodes,
  NodeOutputData
} from '@/lib/node-execution-store'

import { NodeActionsSheet } from './NodeActionsSheet'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'

import { TRIGGER_NODE_TYPES, ALL_NODE_TYPES } from '@/constants'
import {
  createNode,
  createEdge,
  calculateNewNodePosition
} from '@/lib/react-flow-utils'
import { AddNodeSheetContent } from '@/app/(main)/workflows/[id]/_components/AddNodeSheet'
import { ValueOf } from '@/types/index.types'
import { TActionID } from '@shared/constants'

export function TriggerNode({ data, id }: NodeProps<BaseNodeProps>) {
  const node =
    TRIGGER_NODE_DEFINITIONS[data.type as keyof typeof TRIGGER_NODE_TYPES]
  const isManualTrigger = data.type === TRIGGER_NODE_TYPES.MANUAL_TRIGGER
  const { setNodes, setEdges, getEdges, getNodes } = useReactFlow()
  const executeNodeMutation = useExecuteNode()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [replaceSheetOpen, setReplaceSheetOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)

  // Get available inputs from predecessor nodes (stored in their data.lastOutput)
  // Using useStore to properly subscribe to node/edge changes
  const availableInputs = useStore((state) => {
    return getAvailableInputsFromNodes(
      id,
      state.edges.map((e) => ({ source: e.source, target: e.target })),
      state.nodes.map((n) => ({
        id: n.id,
        data: {
          type: n.data.type as string,
          actionId: n.data.actionId as TActionID | undefined,
          lastOutput: n.data.lastOutput as Record<string, any> | undefined
        }
      }))
    )
  })

  // Get this node's output from its data - use useStore to ensure reactivity
  const nodeOutput: NodeOutputData | undefined = useStore((state) => {
    const currentNode = state.nodes.find((n) => n.id === id)
    if (currentNode?.data?.lastOutput) {
      return {
        nodeId: id,
        actionId: (currentNode.data.actionId as TActionID) || '',
        output: currentNode.data.lastOutput as Record<string, any>,
        executedAt: currentNode.data.lastExecutedAt
          ? new Date(currentNode.data.lastExecutedAt as string)
          : new Date()
      }
    }
    return undefined
  })

  // Check if this node has outgoing edges - subscribe to edge changes via useStore
  const isSourceConnected = useStore((state) =>
    state.edges.some((e) => e.source === id)
  )

  const addNode = (nodeType: ValueOf<typeof ALL_NODE_TYPES>) => {
    const nodes = getNodes()
    const edges = getEdges()
    const currentNode = nodes.find((n) => n.id === id)
    if (!currentNode) return

    // Calculate position for the new node relative to current node
    const newPosition = calculateNewNodePosition(nodes, edges, {
      fromNode: currentNode,
      offsetX: 250
    })

    // Create the new node using utility function
    const newNode = createNode(nodeType, newPosition)

    // Add the new node
    setNodes((nds) => [...nds, newNode])

    // Create an edge from the current node to the new node
    const newEdge = createEdge(id, newNode.id)
    setEdges((eds) => addEdge(newEdge, eds))

    setSheetOpen(false)
  }

  const handleConfigure = useCallback(() => {
    setConfigDialogOpen(true)
  }, [])

  const handleReplaceTrigger = useCallback(
    (newTriggerType: ValueOf<typeof TRIGGER_NODE_TYPES>) => {
      // Get current node position
      const nodes = getNodes()
      const currentNode = nodes.find((n) => n.id === id)
      if (!currentNode) return

      // Create new node data with the new trigger type
      // The createNode function auto-configures trigger nodes
      const newNode = createNode(newTriggerType, currentNode.position, { id })

      // Replace the node data
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? {
                ...n,
                data: newNode.data
              }
            : n
        )
      )

      setReplaceSheetOpen(false)
    },
    [id, getNodes, setNodes]
  )

  const handleSaveConfig = useCallback(
    (configData: { nodeId: string; actionId: TActionID; config: any }) => {
      // Update the node data with the configuration
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  config: configData.config,
                  actionId: configData.actionId
                }
              }
            : node
        )
      )
    },
    [id, setNodes]
  )

  // Check if node has existing config and find the action
  const getPreSelectedAction = () => {
    if (!data.actionId || !data.config) {
      return node.actions[0]
    }

    // Find the action from the node's actions that matches the saved actionId
    const action = node.actions.find((act) => act.id === data.actionId)
    return action
  }

  // If node definition doesn't exist, return null
  if (!node) {
    return null
  }

  const nodeColor = node.color
  const iconBackgroundStyle = nodeColor
    ? { backgroundColor: `${nodeColor}1a` }
    : undefined
  const iconColorStyle = nodeColor ? { color: nodeColor } : undefined
  const isRunning = data.isExecuting || executeNodeMutation.isPending
  const statusBorderClass = isRunning
    ? 'border-border/50'
    : data.lastStatus === 'completed'
      ? 'border-2 border-green-500/70'
      : data.lastStatus === 'failed'
        ? 'border-2 border-red-500/70'
        : 'border-border/50'

  // Render icon - either from StaticImageData or LucideIcon component
  const renderIcon = () => {
    if (node.icon) {
      return <Image src={node.icon} alt={node.label} width={24} height={24} />
    }
    if (node.iconComponent) {
      const IconComponent = node.iconComponent
      return (
        <IconComponent
          className='size-6 text-foreground'
          style={iconColorStyle}
        />
      )
    }
    return <Play className='size-6 text-foreground' style={iconColorStyle} />
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className='relative group z-0'>
          <div className='absolute -top-[26px] right-0 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center'>
            {!isManualTrigger && (
              <NodeActionsSheet
                node={node}
                nodeId={id}
                onSaveConfig={handleSaveConfig}
                preSelectedAction={getPreSelectedAction()}
                initialConfig={data.config}
                open={configDialogOpen}
                onOpenChange={setConfigDialogOpen}
                availableInputs={availableInputs}
                nodeOutput={nodeOutput}
                isTrigger
              />
            )}
            <Sheet open={replaceSheetOpen} onOpenChange={setReplaceSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  size='icon'
                  variant='outline'
                  className='h-6 w-6 bg-background border-border/50 shadow-sm hover:bg-accent/50 hover:border-accent/60 hover:shadow-md transition-all'
                >
                  <RefreshCw className='h-3 w-3' />
                </Button>
              </SheetTrigger>
              <AddNodeSheetContent
                onOpenChange={setReplaceSheetOpen}
                onAddNode={(nodeType) =>
                  handleReplaceTrigger(
                    nodeType as ValueOf<typeof TRIGGER_NODE_TYPES>
                  )
                }
                showOnlyTriggers
              />
            </Sheet>
          </div>

          {isRunning && (
            <div aria-hidden='true' className='executing-ring-container'>
              <div className='executing-ring-spin' />
            </div>
          )}

          <Card
            className={cn(
              'relative z-10 w-48 p-4 rounded-lg border transition-all duration-300 bg-card',
              statusBorderClass
            )}
          >
            {!isRunning && data.lastStatus === 'completed' && (
              <Check className='absolute top-2 right-2 z-10 h-4 w-4 text-green-600' />
            )}
            {!isRunning && data.lastStatus === 'failed' && (
              <X className='absolute top-2 right-2 z-10 h-4 w-4 text-red-600' />
            )}
            {/* Content */}
            <div className='flex items-center gap-3'>
              <div
                className={cn(
                  'p-3 rounded-xl bg-linear-to-br from-white/10 to-white/5 shadow-lg shadow-black/10 ring-1 ring-black/5',
                  'aspect-square relative overflow-hidden transition-colors'
                )}
                style={iconBackgroundStyle}
              >
                <div className='relative z-10'>{renderIcon()}</div>
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='font-semibold text-sm text-foreground truncate'>
                  {node.label}
                </h3>
                <p className='text-xs text-muted-foreground font-medium truncate'>
                  {data.actionId
                    ? data.actionId
                        .split('_')
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join(' ')
                    : 'Configure'}
                </p>
              </div>
            </div>

            {/* Trigger nodes have NO target handle (no input) */}
            {/* Only source handle (output) */}
            <Handle
              className='bg-muted-foreground! border-muted-foreground!'
              style={{
                width: 14,
                height: 14,
                cursor: isSourceConnected ? 'crosshair' : 'pointer'
              }}
              type='source'
              position={Position.Right}
            >
              {!isSourceConnected && (
                <div className='flex items-center -translate-y-3'>
                  <div className='min-w-12 ml-1 border-t-2 border-muted-foreground' />

                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                      <div className='border-2 p-1 rounded border-muted-foreground'>
                        <Plus className='text-muted-foreground' size={24} />
                      </div>
                    </SheetTrigger>

                    <AddNodeSheetContent
                      onOpenChange={setSheetOpen}
                      onAddNode={addNode}
                      showOnlyActions
                    />
                  </Sheet>
                </div>
              )}
            </Handle>
          </Card>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className='w-44'>
        {!isManualTrigger && (
          <ContextMenuItem className='gap-3' onClick={handleConfigure}>
            <Settings className='h-4 w-4' />
            Configure
          </ContextMenuItem>
        )}

        <ContextMenuItem
          className='gap-3'
          onClick={() => setReplaceSheetOpen(true)}
        >
          <RefreshCw className='h-4 w-4' />
          Replace
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

// Wrap with memo to prevent unnecessary re-renders
export const TriggerNodeMemo = React.memo(
  TriggerNode,
  (prevProps, nextProps) => {
    // Only re-render if data or selected state changes
    return (
      prevProps.id === nextProps.id &&
      prevProps.data === nextProps.data &&
      prevProps.selected === nextProps.selected
    )
  }
)
