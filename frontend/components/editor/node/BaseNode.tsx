'use client'

import {
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  useEdges,
  useNodes,
  addEdge
} from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Pause, Play, Settings, Trash2, Plus, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import React, { useState } from 'react'
import { BaseNodeProps } from '@/types/node.types'
import { NODE_DEFINITIONS } from '@/constants/registry'

import { NodeActionsSheet } from './NodeActionsSheet'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

import googleDriveIcon from '@/public/google-drive.png'
import gmailIcon from '@/public/gmail.png'
import { NODE_TYPES } from '@/constants'

const nodesOptions = [
  { id: NODE_TYPES.GMAIL, name: 'Gmail', icon: gmailIcon },
  { id: NODE_TYPES.GOOGLE_DRIVE, name: 'Google Drive', icon: googleDriveIcon }
]

export function BaseNode({ data, id }: NodeProps<BaseNodeProps>) {
  const node = NODE_DEFINITIONS[data.type]
  const { setNodes, setEdges } = useReactFlow()
  const edges = useEdges()
  const nodes = useNodes()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const addNode = (
    nodeType: typeof NODE_TYPES.GOOGLE_DRIVE | typeof NODE_TYPES.GMAIL
  ) => {
    const currentNode = nodes.find((n) => n.id === id)
    if (!currentNode) return

    // Generate unique node ID using timestamp
    const newNodeId = `n${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`

    // Position new node at the same Y level and a little to the right
    const offsetX = 250 // Distance to the right
    const newNode = {
      id: newNodeId,
      type: 'custom_node',
      position: {
        x: currentNode.position.x + offsetX,
        y: currentNode.position.y
      },
      data: {
        type: nodeType
      }
    }

    // Add the new node
    setNodes((nds) => [...nds, newNode])

    // Create an edge from the current node to the new node
    setEdges((eds) =>
      addEdge(
        {
          id: `e${id}-${newNodeId}`,
          source: id,
          target: newNodeId,
          type: 'default',
          style: {
            strokeWidth: 2,
            stroke: '#9ca3af'
          },
          markerEnd: {
            type: 'arrowclosed' as const,
            color: '#9ca3af',
            width: 12,
            height: 12
          }
        },
        eds
      )
    )

    setSheetOpen(false)
  }

  // Check if the source handle is connected
  // Using useEdges hook ensures the component re-renders when edges change
  const isSourceConnected = edges.some((edge) => edge.source === id)

  const handleDelete = () => {
    // Remove the node and all connected edges directly
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))

    setDeleteDialogOpen(false)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className='relative group'>
          <div className='absolute -top-5 right-0 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center'>
            <NodeActionsSheet node={node} />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size='sm'
                  variant='outline'
                  className='h-6 w-6 p-0 bg-background/90 backdrop-blur-sm border-border/60 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive'
                >
                  <Trash2 className='h-3.5 w-3.5' />
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
            className={`
        relative w-48 p-4 rounded-lg border transition-all duration-200
        bg-card/95 backdrop-blur-sm border-border/50
      `}
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
                  {' '}
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
                <div className='flex items-center -translate-y-[12px]'>
                  <div className='min-w-12 ml-1 border-t-2 border-muted-foreground' />

                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                      <div className='border-2 p-1 rounded border-muted-foreground'>
                        <Plus className='text-muted-foreground' size={24} />
                      </div>
                    </SheetTrigger>

                    <SheetContent side='right' className='sm:max-w-md'>
                      <SheetHeader>
                        <SheetTitle className='text-lg font-semibold'>
                          Select a Node
                        </SheetTitle>
                        <SheetDescription>
                          Choose a node and configure it to perform various
                          tasks
                        </SheetDescription>
                      </SheetHeader>
                      <div className='grid gap-3 p-4 pt-2'>
                        {nodesOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => addNode(option.id)}
                            className='flex cursor-pointer w-full items-center justify-between rounded-lg border bg-card p-3 text-left transition hover:bg-muted'
                          >
                            <div className='flex items-center gap-3'>
                              <span className='relative h-12 w-12 overflow-hidden rounded-md bg-white shadow-sm dark:bg-zinc-900'>
                                <Image
                                  src={option.icon}
                                  alt={option.name}
                                  fill
                                  sizes='48px'
                                  className='object-contain p-2'
                                />
                              </span>
                              <div className='flex flex-col'>
                                <span className='text-sm font-semibold'>
                                  {option.name}
                                </span>
                                <span className='text-xs text-muted-foreground'>
                                  Connect and manage secure access
                                </span>
                              </div>
                            </div>
                            <ChevronRight className='h-4 w-4 text-muted-foreground group-hover:text-accent-foreground' />
                          </button>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              )}
            </Handle>
          </Card>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className='w-44 space-y-2'>
        <ContextMenuItem className='gap-3'>
          <Play />
          Run
        </ContextMenuItem>
        <ContextMenuItem className='gap-3' disabled>
          <Pause />
          Pause
        </ContextMenuItem>

        <ContextMenuItem className='gap-3'>
          <Settings />
          Configure
        </ContextMenuItem>

        <ContextMenuItem className='gap-3' variant='destructive'>
          <Trash2 />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
