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

import { Check, Settings, Trash2, Plus, Play, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { BaseNodeProps } from '@/types/node.types'
import { cn } from '@/lib/utils'
import {
  getAvailableInputsFromNodes,
  NodeOutputData
} from '@/lib/node-execution-store'
import { useExecuteNode } from '@/hooks/use-workflows'
import { useWorkflowEditor } from '@/app/(main)/workflows/[id]/_context/WorkflowEditorContext'

import { NodeActionsSheet } from '@/components/editor/node/NodeActionsSheet'

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

export function ConditionNode({ data, id }: NodeProps<BaseNodeProps>) {
  const { setNodes, setEdges, getEdges, getNodes } = useReactFlow()
  const params = useParams()
  const workflowId = params?.id ? String(params.id) : null
  const executeNodeMutation = useExecuteNode()
  const { saveIfChanged, isAnyOperationPending, setIsExecutingNode } =
    useWorkflowEditor()

  const [trueSheetOpen, setTrueSheetOpen] = useState(false)
  const [falseSheetOpen, setFalseSheetOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)

  // Get the condition node definition from registry
  const node = NODE_DEFINITIONS[NODE_TYPES.CONDITION]

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

  // Check if each handle has outgoing edges
  const trueHandleConnected = useStore((state) =>
    state.edges.some((e) => e.source === id && e.sourceHandle === 'true')
  )
  const falseHandleConnected = useStore((state) =>
    state.edges.some((e) => e.source === id && e.sourceHandle === 'false')
  )

  const addNodeFromHandle = (
    nodeType: ValueOf<typeof ALL_NODE_TYPES>,
    handleType: 'true' | 'false'
  ) => {
    const nodes = getNodes()
    const edges = getEdges()
    const currentNode = nodes.find((n) => n.id === id)
    if (!currentNode) return

    // Calculate offset based on handle type
    const yOffset = handleType === 'true' ? -60 : 60

    // Calculate position for the new node
    const newPosition = calculateNewNodePosition(nodes, edges, {
      fromNode: currentNode,
      offsetX: 250,
      offsetY: yOffset
    })

    // Create the new node
    const newNode = createNode(nodeType, newPosition)

    // Add the new node
    setNodes((nds) => [...nds, newNode])

    // Create an edge from the condition node to the new node with the handle
    const newEdge = createEdge(id, newNode.id)
    newEdge.sourceHandle = handleType
    setEdges((eds) => addEdge(newEdge, eds))

    if (handleType === 'true') {
      setTrueSheetOpen(false)
    } else {
      setFalseSheetOpen(false)
    }
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

  // Check if node has existing config and find the action
  const getPreSelectedAction = () => {
    if (!data.actionId || !data.config) {
      return undefined
    }

    const action = node.actions.find((act) => act.id === data.actionId)
    return action
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
                    lastExecutedAt: new Date().toISOString(),
                    lastStatus: 'completed'
                  }
                }
              : n
          )
        )
      } else {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    lastExecutedAt: new Date().toISOString(),
                    lastStatus: 'completed'
                  }
                }
              : n
          )
        )
      }
    } catch (error) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  lastExecutedAt: new Date().toISOString(),
                  lastStatus: 'failed'
                }
              }
            : n
        )
      )
      throw error
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

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className='relative group z-0'>
          <div className='absolute -top-[26px] right-0 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center'>
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
                    Are you sure you want to delete this condition node? This
                    action cannot be undone and will remove all connections.
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
                  'aspect-square relative overflow-hidden flex items-center justify-center transition-colors'
                )}
                style={iconBackgroundStyle}
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
                    <node.iconComponent
                      className='h-6 w-6 text-foreground'
                      style={iconColorStyle}
                    />
                  ) : null}
                </div>
              </div>
              <div className='flex-1 min-w-0'>
                <h3 className='font-semibold text-sm text-foreground truncate'>
                  {node.label}
                </h3>
                <p className='text-xs text-muted-foreground font-medium truncate'>
                  {data.config?.conditions?.length
                    ? `${data.config.conditions.length} condition${data.config.conditions.length > 1 ? 's' : ''}`
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

            {/* True Output Handle - Top */}
            <Handle
              id='true'
              type='source'
              position={Position.Right}
              className='bg-muted-foreground! border-muted-foreground!'
              style={{
                width: 14,
                height: 14,
                top: '20%',
                cursor: trueHandleConnected ? 'crosshair' : 'pointer'
              }}
            >
              <span className='absolute -left-8 text-[10px] font-medium text-muted-foreground whitespace-nowrap'>
                True
              </span>
              {!trueHandleConnected && (
                <div className='flex items-center -translate-y-3'>
                  <div className='min-w-12 ml-1 border-t-2 border-muted-foreground' />
                  <Sheet open={trueSheetOpen} onOpenChange={setTrueSheetOpen}>
                    <SheetTrigger asChild>
                      <div className='border-2 p-1 rounded border-muted-foreground'>
                        <Plus className='text-muted-foreground' size={24} />
                      </div>
                    </SheetTrigger>
                    <AddNodeSheetContent
                      onOpenChange={setTrueSheetOpen}
                      onAddNode={(nodeType) =>
                        addNodeFromHandle(nodeType, 'true')
                      }
                      showOnlyActions
                    />
                  </Sheet>
                </div>
              )}
            </Handle>

            {/* False Output Handle - Bottom */}
            <Handle
              id='false'
              type='source'
              position={Position.Right}
              className='bg-muted-foreground! border-muted-foreground!'
              style={{
                width: 14,
                height: 14,
                top: '80%',
                cursor: falseHandleConnected ? 'crosshair' : 'pointer'
              }}
            >
              <span className='absolute -left-8 text-[10px] font-medium text-muted-foreground whitespace-nowrap'>
                False
              </span>
              {!falseHandleConnected && (
                <div className='flex items-center -translate-y-3'>
                  <div className='min-w-12 ml-1 border-t-2 border-muted-foreground' />
                  <Sheet open={falseSheetOpen} onOpenChange={setFalseSheetOpen}>
                    <SheetTrigger asChild>
                      <div className='border-2 p-1 rounded border-muted-foreground'>
                        <Plus className='text-muted-foreground' size={24} />
                      </div>
                    </SheetTrigger>
                    <AddNodeSheetContent
                      onOpenChange={setFalseSheetOpen}
                      onAddNode={(nodeType) =>
                        addNodeFromHandle(nodeType, 'false')
                      }
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
        <ContextMenuItem
          className='gap-3'
          onClick={handleExecuteNode}
          disabled={
            !data.actionId ||
            !data.config ||
            executeNodeMutation.isPending ||
            isAnyOperationPending
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
export const ConditionNodeMemo = React.memo(
  ConditionNode,
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.data === nextProps.data &&
      prevProps.selected === nextProps.selected
    )
  }
)
