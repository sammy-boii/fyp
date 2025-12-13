'use client'

import { useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  Edge,
  ConnectionLineType
} from '@xyflow/react'

import type {
  Node,
  OnConnect,
  OnEdgesChange,
  OnNodesChange
} from '@xyflow/react'

import { nodeTypes } from '@/types/node.types'

import { NODE_TYPES } from '@/constants'

export default function WorkflowPage() {
  const initialNodes: Node[] = [
    {
      id: 'n1',
      type: 'custom_node',
      position: { x: 280, y: 160 },
      data: {
        type: NODE_TYPES.GOOGLE_DRIVE
      }
    },

    {
      id: 'n2',
      type: 'custom_node',
      position: { x: 480, y: 160 },
      data: {
        type: NODE_TYPES.GMAIL
      }
    }
  ]

  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState<Edge[]>([])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  )
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  )
  const onConnect: OnConnect = useCallback(
    (connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'bezier',
            style: {
              strokeWidth: 2,
              stroke: '#9ca3af'
            },
            markerEnd: {
              type: 'arrowclosed',
              color: '#9ca3af',
              width: 12,
              height: 12
            }
          },
          eds
        )
      ),
    [setEdges]
  )

  return (
    <div className='w-full h-screen'>
      <ReactFlow
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        className='bg-background'
        connectionLineType={ConnectionLineType.Bezier}
        defaultEdgeOptions={{
          type: 'bezier',
          style: {
            strokeWidth: 2,
            stroke: '#9ca3af'
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#9ca3af',
            width: 12,
            height: 12
          }
        }}
        fitView
      >
        <Background gap={40} />
      </ReactFlow>
    </div>
  )
}
