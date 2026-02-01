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

import { Play, Settings, Trash2, Plus } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback } from 'react'
import { BaseNodeProps } from '@/types/node.types'
import { TRIGGER_NODE_DEFINITIONS } from '@/constants/registry'
import { useParams } from 'next/navigation'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

import { TRIGGER_NODE_TYPES, ALL_NODE_TYPES } from '@/constants'
import {
  createNode,
  createEdge,
  calculateNewNodePosition
} from '@/lib/react-flow-utils'
import { AddNodeSheetContent } from '@/app/(main)/workflows/[id]/_components/AddNodeSheet'
import { useWorkflowEditor } from '@/app/(main)/workflows/[id]/_context/WorkflowEditorContext'
import { ValueOf } from '@/types/index.types'
import { TActionID } from '@shared/constants'

export function TriggerNode({ data, id }: NodeProps<BaseNodeProps>) {
  const node =
    TRIGGER_NODE_DEFINITIONS[data.type as keyof typeof TRIGGER_NODE_TYPES]
  const isManualTrigger = data.type === TRIGGER_NODE_TYPES.MANUAL_TRIGGER
  const { setNodes, setEdges, getEdges, getNodes } = useReactFlow()
  const params = useParams()
  const workflowId = params?.id ? String(params.id) : null
  const executeNodeMutation = useExecuteNode()
  const { saveIfChanged, isAnyOperationPending, setIsExecutingNode } =
    useWorkflowEditor()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
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

  const handleExecuteNode = useCallback(async () => {
    if (!workflowId) {
      return
    }

    if (!data.actionId || !data.config) {
      return
    }

    // Don't execute if any other operation is pending
    if (isAnyOperationPending) {
      return
    }

    setIsExecutingNode(true)
    try {
      // Auto-save workflow if there are changes before executing
      await saveIfChanged()

      const result = await executeNodeMutation.mutateAsync({
        workflowId,
        nodeId: id
      })

      // Store the output in the node's data (persisted with workflow)
      if (result?.data?.output) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    lastOutput: result.data.output,
                    lastExecutedAt: new Date().toISOString()
                  }
                }
              : n
          )
        )
      }
    } finally {
      setIsExecutingNode(false)
    }
  }, [
    workflowId,
    data.actionId,
    data.config,
    executeNodeMutation,
    id,
    setNodes,
    saveIfChanged,
    isAnyOperationPending,
    setIsExecutingNode
  ])

  const handleConfigure = useCallback(() => {
    setConfigDialogOpen(true)
  }, [])

  const handleDelete = useCallback(() => {
    // Remove the node and all connected edges directly
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => {
      const filtered = eds.filter((e) => e.source !== id && e.target !== id)
      return filtered
    })

    setDeleteDialogOpen(false)
  }, [id, setNodes, setEdges])

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

  // Render icon - either from StaticImageData or LucideIcon component
  const renderIcon = () => {
    if (node.icon) {
      return <Image src={node.icon} alt={node.label} width={24} height={24} />
    }
    if (node.iconComponent) {
      const IconComponent = node.iconComponent
      return <IconComponent className='size-6' />
    }
    return <Play className='size-6' />
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className='relative group'>
          <div className='absolute -top-5 right-0 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center'>
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
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size='icon'
                  variant='outline'
                  className='h-6 w-6 bg-background border-border/50 shadow-sm hover:bg-destructive/10 hover:border-destructive/60 hover:text-destructive hover:shadow-md transition-all'
                >
                  <Trash2 className='h-3 w-3' />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2'>
                    <div className='p-2 rounded-md bg-destructive/20'>
                      <Trash2 className='size-5 text-destructive' />
                    </div>
                    Delete Trigger
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this trigger? This action
                    cannot be undone and will remove all connections to this
                    trigger.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant='destructive' onClick={handleDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card
            className={`relative w-48 p-4 rounded-lg border transition-all duration-300 bg-card ${
              data.isExecuting || executeNodeMutation.isPending
                ? 'border-transparent animate-executing-border'
                : 'border-border/50'
            }`}
          >
            {/* Content */}
            <div className='flex items-center gap-3'>
              <div
                className={`p-3 rounded-xl 
      bg-linear-to-br from-white/10 to-white/5 
      shadow-lg shadow-black/10 ring-1 ring-black/5
      aspect-square relative overflow-hidden
    `}
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
          variant='destructive'
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className='h-4 w-4' />
          Delete
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
