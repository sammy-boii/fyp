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

import { Settings, Trash2, Plus, Play, Loader2 } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback, memo } from 'react'
import { useParams } from 'next/navigation'
import { BaseNodeProps } from '@/types/node.types'
import {
  getAvailableInputsFromNodes,
  NodeOutputData
} from '@/lib/node-execution-store'
import { useExecuteNode } from '@/hooks/use-workflows'
import { useWorkflowEditor } from '@/app/(main)/workflows/[id]/_context/WorkflowEditorContext'

import NodeConfigurationDialog from '@/components/editor/node/NodeConfigurationDialog'

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

import { ALL_NODE_TYPES, NODE_TYPES } from '@/constants'
import { NODE_DEFINITIONS } from '@/constants/registry'
import {
  createNode,
  createEdge,
  calculateNewNodePosition
} from '@/lib/react-flow-utils'
import { AddNodeSheetContent } from '@/app/(main)/workflows/[id]/_components/AddNodeSheet'
import { ValueOf } from '@/types/index.types'
import { TActionID } from '@shared/constants'

export function AINode({ data, id }: NodeProps<BaseNodeProps>) {
  const { setNodes, setEdges, getEdges, getNodes } = useReactFlow()
  const params = useParams()
  const workflowId = params?.id ? String(params.id) : null
  const executeNodeMutation = useExecuteNode()
  const { saveIfChanged, isAnyOperationPending, setIsExecutingNode } =
    useWorkflowEditor()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)

  // Get available inputs from predecessor nodes
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

  // Get this node's output from its data
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

  // Check if this node has outgoing edges
  const isSourceConnected = useStore((state) =>
    state.edges.some((e) => e.source === id)
  )

  const addNode = (nodeType: ValueOf<typeof ALL_NODE_TYPES>) => {
    const nodes = getNodes()
    const edges = getEdges()
    const currentNode = nodes.find((n) => n.id === id)
    if (!currentNode) return

    const newPosition = calculateNewNodePosition(nodes, edges, {
      fromNode: currentNode,
      offsetX: 250
    })

    const newNode = createNode(nodeType, newPosition)
    setNodes((nds) => [...nds, newNode])

    const newEdge = createEdge(id, newNode.id)
    setEdges((eds) => addEdge(newEdge, eds))

    setSheetOpen(false)
  }

  const handleConfigure = useCallback(() => {
    setConfigDialogOpen(true)
  }, [])

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => {
      const filtered = eds.filter((e) => e.source !== id && e.target !== id)
      return filtered
    })
    setDeleteDialogOpen(false)
  }, [id, setNodes, setEdges])

  const handleSaveConfig = useCallback(
    (configData: { nodeId: string; actionId: TActionID; config: any }) => {
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

  const handleExecuteNode = useCallback(async () => {
    if (!workflowId) {
      return
    }

    if (!data.actionId || !data.config) {
      return
    }

    if (isAnyOperationPending) {
      return
    }

    setIsExecutingNode(true)
    try {
      await saveIfChanged()

      const result = await executeNodeMutation.mutateAsync({
        workflowId,
        nodeId: id
      })

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

  // Get the AI node definition from registry
  const node = NODE_DEFINITIONS[NODE_TYPES.AI]
  const aiAction = node.actions[0]

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
            <Button
              size='icon'
              variant='outline'
              className='h-6 w-6 bg-background border-border/50 shadow-sm hover:bg-muted hover:border-border hover:shadow-md transition-all'
              onClick={handleConfigure}
            >
              <Settings className='h-3 w-3' />
            </Button>
            <NodeConfigurationDialog
              action={aiAction}
              isOpen={configDialogOpen}
              setIsOpen={setConfigDialogOpen}
              nodeId={id}
              onSaveConfig={handleSaveConfig}
              initialConfig={data.config}
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
                    Are you sure you want to delete this AI node? This action
                    cannot be undone and will remove all connections.
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
                  aspect-square relative overflow-hidden flex items-center justify-center
                `}
              >
                <div className='relative z-10'>
                  {node.icon ? (
                    <Image
                      src={node.icon}
                      alt={node.label}
                      width={24}
                      height={24}
                    />
                  ) : node.iconComponent ? (
                    <node.iconComponent className='h-6 w-6 text-foreground' />
                  ) : null}
                </div>
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='font-semibold text-sm text-foreground truncate'>
                  {node.label}
                </h3>
                <p className='text-xs text-muted-foreground font-medium truncate'>
                  {data.config?.prompt
                    ? data.config.prompt.length > 20
                      ? `${data.config.prompt.substring(0, 20)}...`
                      : data.config.prompt
                    : 'Configure'}
                </p>
              </div>
            </div>

            {/* Input Handle */}
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

            {/* Output Handle */}
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
      <ContextMenuContent>
        <ContextMenuItem
          onClick={handleExecuteNode}
          disabled={
            !data.actionId ||
            !data.config ||
            executeNodeMutation.isPending ||
            isAnyOperationPending
          }
        >
          {executeNodeMutation.isPending ? (
            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
          ) : (
            <Play className='h-4 w-4 mr-2' />
          )}
          Run
        </ContextMenuItem>
        <ContextMenuItem onClick={handleConfigure}>
          <Settings className='h-4 w-4 mr-2' />
          Configure
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => setDeleteDialogOpen(true)}
          variant='destructive'
        >
          <Trash2 className='h-4 w-4 mr-2' />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export const AINodeMemo = memo(AINode)
