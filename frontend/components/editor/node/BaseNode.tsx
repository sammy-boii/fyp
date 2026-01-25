'use client'

import {
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  addEdge
} from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Play, Settings, Trash2, Plus, Loader2 } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { BaseNodeProps } from '@/types/node.types'
import { NODE_DEFINITIONS } from '@/constants/registry'
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

import { NODE_TYPES } from '@/constants'
import {
  createNode,
  createEdge,
  calculateNewNodePosition
} from '@/lib/react-flow-utils'
import { AddNodeSheetContent } from '@/app/(main)/workflows/[id]/_components/AddNodeSheet'

export function BaseNode({ data, id }: NodeProps<BaseNodeProps>) {
  const node = NODE_DEFINITIONS[data.type]
  const { setNodes, setEdges, getEdges, getNodes } = useReactFlow()
  const params = useParams()
  const workflowId = params?.id ? String(params.id) : null
  const executeNodeMutation = useExecuteNode()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [isSourceConnected, setIsSourceConnected] = useState(false)

  // Get available inputs from predecessor nodes (stored in their data.lastOutput)
  const availableInputs = useMemo(() => {
    const edges = getEdges()
    const nodes = getNodes()
    return getAvailableInputsFromNodes(
      id,
      edges.map((e) => ({ source: e.source, target: e.target })),
      nodes.map((n) => ({
        id: n.id,
        data: {
          type: n.data.type as string,
          actionId: n.data.actionId as string | undefined,
          lastOutput: n.data.lastOutput as Record<string, any> | undefined
        }
      }))
    )
  }, [id, getEdges, getNodes])

  // Get this node's output from its data
  const nodeOutput: NodeOutputData | undefined = useMemo(() => {
    if (data.lastOutput) {
      return {
        nodeId: id,
        actionId: data.actionId || '',
        output: data.lastOutput,
        executedAt: data.lastExecutedAt
          ? new Date(data.lastExecutedAt)
          : new Date()
      }
    }
    return undefined
  }, [data.lastOutput, data.lastExecutedAt, data.actionId, id])

  // Update isSourceConnected if this node has outgoing edges
  useEffect(() => {
    const edges = getEdges()
    const hasOutgoing = edges.some((e) => e.source === id)
    setIsSourceConnected(hasOutgoing)
  }, [getEdges, id])

  const addNode = (
    nodeType: typeof NODE_TYPES.GOOGLE_DRIVE | typeof NODE_TYPES.GMAIL
  ) => {
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

    setIsSourceConnected(true)
    setSheetOpen(false)
  }

  const handleExecuteNode = useCallback(async () => {
    if (!workflowId) return

    if (!data.actionId || !data.config) {
      return
    }

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
  }, [
    workflowId,
    data.actionId,
    data.config,
    executeNodeMutation,
    id,
    setNodes
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
    (configData: { nodeId: string; actionId: string; config: any }) => {
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
      return undefined
    }

    // Find the action from the node's actions that matches the saved actionId
    const action = node.actions.find((act) => act.id === data.actionId)
    return action
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className='relative group'>
          <div className='absolute -top-5 right-0 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center'>
            <Button
              size='icon'
              variant='outline'
              className='h-6 w-6 bg-background border-border/50 shadow-sm hover:bg-green-500/10 hover:border-green-500/60 hover:text-green-500 hover:shadow-md disabled:opacity-40 disabled:hover:bg-background transition-all'
              onClick={handleExecuteNode}
              disabled={
                !data.actionId || !data.config || executeNodeMutation.isPending
              }
            >
              {executeNodeMutation.isPending ? (
                <Loader2 className='h-3 w-3 animate-spin' />
              ) : (
                <Play className='h-3 w-3' />
              )}
            </Button>
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
            />
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
                    Delete Node
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this node? This action
                    cannot be undone and will remove all connections to this
                    node.
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
              data.isExecuting
                ? 'border-primary animate-executing-border'
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
                <div className='relative z-10'>
                  <Image
                    src={node.icon}
                    alt={node.label}
                    width={24}
                    height={24}
                  />
                </div>
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='font-semibold text-sm text-foreground truncate'>
                  {node.label}
                </h3>
                <p className='text-xs text-muted-foreground capitalize font-medium'>
                  Action
                </p>
              </div>
            </div>

            {/* Connection handles */}
            <Handle
              type='target'
              position={Position.Left}
              style={{
                width: '10px',
                borderRadius: '4px 0px 0px 4px',
                height: '28px',
                left: '-5px',
                border: 'none',
                background: 'gray'
              }}
            />

            {/* Right handle - Conditional styling based on connection state */}
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
                    />
                  </Sheet>
                </div>
              )}
            </Handle>
          </Card>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className='w-44'>
        <ContextMenuItem
          className='gap-3'
          onClick={handleExecuteNode}
          disabled={
            !data.actionId || !data.config || executeNodeMutation.isPending
          }
        >
          {executeNodeMutation.isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Play className='h-4 w-4' />
          )}
          Run
        </ContextMenuItem>

        <ContextMenuItem className='gap-3' onClick={handleConfigure}>
          <Settings className='h-4 w-4' />
          Configure
        </ContextMenuItem>

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
export const BaseNodeMemo = React.memo(BaseNode, (prevProps, nextProps) => {
  // Only re-render if data or selected state changes
  return (
    prevProps.id === nextProps.id &&
    prevProps.data === nextProps.data &&
    prevProps.selected === nextProps.selected
  )
})
