'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  ConnectionLineType
} from '@xyflow/react'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'

import type { Node, OnEdgesChange, OnNodesChange } from '@xyflow/react'

import { nodeTypes, edgeTypes } from '@/types/node.types'
import { Button } from '@/components/ui/button'
import { useGetWorkflow } from '@/hooks/use-workflows'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'

export default function WorkflowViewPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params?.id ? String(params.id) : null

  const { data, isLoading, isError, error } = useGetWorkflow(workflowId)

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  // Load workflow data when it's fetched
  useEffect(() => {
    if (data?.data) {
      const workflow = data.data
      // Ensure nodes and edges are arrays
      const workflowNodes = Array.isArray(workflow.nodes) ? workflow.nodes : []
      const workflowEdges = Array.isArray(workflow.edges) ? workflow.edges : []

      // Ensure nodes have the correct type
      const formattedNodes: Node[] = workflowNodes.map((node: any) => ({
        ...node,
        type: node.type || 'custom_node'
      }))

      // Ensure edges have proper styling
      const formattedEdges: Edge[] = workflowEdges.map((edge: any) => ({
        ...edge,
        style: {
          strokeWidth: 2,
          stroke: '#9ca3af',
          ...edge.style
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#9ca3af',
          width: 12,
          height: 12,
          ...edge.markerEnd
        }
      }))

      setNodes(formattedNodes)
      setEdges(formattedEdges)
    }
  }, [data])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  )

  if (isLoading) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='text-sm text-muted-foreground'>Loading workflow...</p>
        </div>
      </div>
    )
  }

  if (isError || error || !data?.data) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Loader2 className='h-6 w-6' />
            </EmptyMedia>
            <EmptyTitle>Unable to load workflow</EmptyTitle>
            <EmptyDescription>
              {error?.message || data?.error?.message || 'Workflow not found or access denied'}
            </EmptyDescription>
          </EmptyHeader>
          <Button
            variant='outline'
            onClick={() => router.push('/workflows')}
            className='mt-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Workflows
          </Button>
        </Empty>
      </div>
    )
  }

  const workflow = data.data

  return (
    <div className='w-full h-screen relative flex flex-col'>
      {/* Header */}
      <div className='absolute top-4 left-4 right-4 z-10 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.push('/workflows')}
            className='bg-background/80 backdrop-blur-sm'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div className='bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border'>
            <h1 className='text-lg font-semibold'>{workflow.name || 'Untitled Workflow'}</h1>
            {workflow.description && (
              <p className='text-xs text-muted-foreground'>{workflow.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <ReactFlow
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background gap={40} />
      </ReactFlow>
    </div>
  )
}

