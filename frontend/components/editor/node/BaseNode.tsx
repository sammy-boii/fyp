'use client'

import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Pause, Play, Settings, Trash2, Plus } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { BaseNodeProps } from '@/types/node.types'
import { NODE_DEFINITIONS } from '@/constants/registry'

import { NodeActionsSheet } from './NodeActionsSheet'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'

export function BaseNode({ data, id }: NodeProps<BaseNodeProps>) {
  const node = NODE_DEFINITIONS[data.type]
  const { getEdges } = useReactFlow()

  // Check if the source handle is connected
  const isSourceConnected = getEdges().some((edge) => edge.source === id)

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className='relative group'>
          <div className='absolute -top-5 right-0 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center'>
            <NodeActionsSheet node={node} />
            <Button
              size='sm'
              variant='outline'
              className='h-6 w-6 p-0 bg-background/90 backdrop-blur-sm border-border/60 '
            >
              <Trash2 className='h-3.5 w-3.5' />
            </Button>
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
      bg-gradient-to-br from-white/10 to-white/5 
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
                width: '6px',
                borderRadius: '2px 0px 0px 2px',
                height: '22px',
                left: '-3px',
                border: 'none',
                background: 'gray'
              }}
            />

            {/* Right handle - Conditional styling based on connection state */}
            <Handle
              className='!bg-muted-foreground !border-muted-foreground'
              style={{
                width: 8,
                height: 8,
                cursor: isSourceConnected ? 'crosshair' : 'pointer'
              }}
              type='source'
              position={Position.Right}
            >
              {!isSourceConnected && (
                <div className='flex items-center -translate-y-[12px]'>
                  <div className='min-w-12 ml-1 border-t-2 border-muted-foreground' />
                  <div className='border-2 p-1 rounded border-muted-foreground'>
                    <Plus className='text-muted-foreground' size={16} />
                  </div>
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
