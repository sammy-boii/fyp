'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  ConnectionLineType,
  addEdge
} from '@xyflow/react'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { Node, OnEdgesChange, OnNodesChange } from '@xyflow/react'

import { nodeTypes, edgeTypes } from '@/types/node.types'
import { Button } from '@/components/ui/button'
import {
  useExecuteWorkflow,
  useGetWorkflow,
  useUpdateWorkflow
} from '@/hooks/use-workflows'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { WorkflowHeader } from './_components/WorkflowHeader'
import { AddNodeSheetContent } from './_components/AddNodeSheet'
import { EditWorkflowDialog } from './_components/EditWorkflowDialog'
import {
  DEFAULT_EDGE_OPTIONS,
  createNode,
  createEdge,
  calculateNewNodePosition,
  findLastNode,
  formatNodes,
  formatEdges
} from '@/lib/react-flow-utils'
import { ValueOf } from '@/types/index.types'
import { NODE_TYPES } from '@/constants'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import WorkflowExecutionTab from './_components/WorkflowExecutionTab'
import { useWorkflowWebSocket } from '@/hooks/use-workflow-websocket'

export default function WorkflowViewPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params?.id ? String(params.id) : null

  const { data, isLoading, isError, error } = useGetWorkflow(workflowId)
  const updateWorkflow = useUpdateWorkflow()

  const executeWorkflow = useExecuteWorkflow()

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)

  // WebSocket for live execution updates
  const { executingNodeId: wsExecutingNodeId } = useWorkflowWebSocket(
    workflowId,
    {
      onNodeStart: (nodeId) => {
        setExecutingNodeId(nodeId)
        // Update node data to show executing state
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isExecuting: n.id === nodeId
            }
          }))
        )
      },
      onNodeComplete: (nodeId, output) => {
        setExecutingNodeId(null)
        // Update node data to clear executing state and store output
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isExecuting: false,
              ...(n.id === nodeId && output
                ? {
                    lastOutput: output,
                    lastExecutedAt: new Date().toISOString()
                  }
                : {})
            }
          }))
        )
      },
      onNodeError: (nodeId) => {
        setExecutingNodeId(null)
        // Clear executing state on error
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isExecuting: false
            }
          }))
        )
      },
      onWorkflowComplete: () => {
        setExecutingNodeId(null)
        // Clear all executing states
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isExecuting: false
            }
          }))
        )
      },
      onWorkflowError: () => {
        setExecutingNodeId(null)
        // Clear all executing states
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isExecuting: false
            }
          }))
        )
      }
    }
  )

  // Prevent backspace from deleting nodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const target = e.target as HTMLElement
        // Allow deletion in input fields, textareas, and contenteditable elements
        const isInputField =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('[contenteditable="true"]') ||
          target.closest('input') ||
          target.closest('textarea')

        // If not in an input field, prevent default to stop node deletion
        if (!isInputField && reactFlowWrapper.current?.contains(target)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])

  // Load workflow data when it's fetched (only initialize once)
  useEffect(() => {
    if (data?.data && !hasInitialized.current) {
      const workflow = data.data
      // Ensure nodes and edges are arrays
      const workflowNodes = Array.isArray(workflow.nodes) ? workflow.nodes : []
      const workflowEdges = Array.isArray(workflow.edges) ? workflow.edges : []

      // Format nodes and edges using utility functions
      const formattedNodes: Node[] = formatNodes(workflowNodes)
      const formattedEdges: Edge[] = formatEdges(workflowEdges)

      setNodes(formattedNodes)
      setEdges(formattedEdges)
      setWorkflowName(workflow.name || '')
      setWorkflowDescription(workflow.description || '')
      hasInitialized.current = true
    }
  }, [data])

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const addNode = (nodeType: ValueOf<typeof NODE_TYPES>) => {
    // Find the last node in the chain
    const lastNode = findLastNode(nodes, edges)

    // Calculate position for the new node
    const newPosition = calculateNewNodePosition(nodes, edges, {
      fromNode: lastNode
    })

    // Create the new node using utility function
    const newNode = createNode(nodeType, newPosition)

    // Add the new node
    setNodes((nds) => [...nds, newNode])

    // If there's a last node, create an edge from it to the new node
    if (lastNode) {
      const newEdge = createEdge(lastNode.id, newNode.id)
      setEdges((eds) => addEdge(newEdge, eds))
    }

    setSheetOpen(false)
  }

  async function handleExecuteWorkflow() {
    if (!workflowId) return
    await executeWorkflow.mutateAsync(workflowId)
  }

  function handleSaveWorkflow() {
    if (!workflowId) return

    updateWorkflow.mutate({
      id: workflowId,
      data: {
        name: workflowName,
        description: workflowDescription,
        nodes: nodes as unknown as any[],
        edges: edges as unknown as any[]
      }
    })
  }

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
              {error?.message ||
                data?.error?.message ||
                'Workflow not found or access denied'}
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

  return (
    <div className='relative flex flex-col h-screen'>
      {/* Top Bar */}
      <WorkflowHeader
        workflowName={workflowName}
        workflowDescription={workflowDescription}
        onBack={() => router.push('/workflows')}
        onEdit={() => setEditDialogOpen(true)}
        onSave={handleSaveWorkflow}
        isSaving={updateWorkflow.isPending}
        workflowId={workflowId}
        onExecute={handleExecuteWorkflow}
        isExecuting={executeWorkflow.isPending}
      />

      {/* Edit Workflow Dialog */}
      <EditWorkflowDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        workflowName={workflowName}
        workflowDescription={workflowDescription}
        workflowId={workflowId}
      />

      <Tabs defaultValue='editor'>
        <TabsList className='absolute left-1/2 top-8 -translate-x-1/2 z-10'>
          <TabsTrigger value='editor'>Editor</TabsTrigger>
          <TabsTrigger value='executions'>Executions</TabsTrigger>
        </TabsList>
        <TabsContent value='editor' className='flex-1'>
          <div
            className='w-full h-[90vh] relative flex flex-col'
            ref={reactFlowWrapper}
          >
            {/* Top Right Add Nodes Plus Button */}
            <div className='absolute right-4 top-6 z-10'>
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant='default'
                    size='lg'
                    className='rounded-lg size-10'
                  >
                    <Plus className='size-5' />
                  </Button>
                </SheetTrigger>
                <AddNodeSheetContent
                  onOpenChange={setSheetOpen}
                  onAddNode={addNode}
                />
              </Sheet>
            </div>

            <ReactFlow
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              className='bg-background'
              connectionLineType={ConnectionLineType.Bezier}
              defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
              fitView
              nodesDraggable={true}
              nodesConnectable={false}
              elementsSelectable={true}
            >
              <Background gap={40} />
            </ReactFlow>
          </div>
        </TabsContent>
        <TabsContent value='executions' className='flex-1'>
          <WorkflowExecutionTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
