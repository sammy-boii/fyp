'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  ConnectionLineType
} from '@xyflow/react'

import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  Plus,
  ChevronRight,
  Edit2,
  Save
} from 'lucide-react'
import Image from 'next/image'

import type { Node, OnEdgesChange, OnNodesChange } from '@xyflow/react'

import { nodeTypes, edgeTypes } from '@/types/node.types'
import { Button } from '@/components/ui/button'
import { useGetWorkflow, useUpdateWorkflow } from '@/hooks/use-workflows'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { NODE_TYPES } from '@/constants'
import googleDriveIcon from '@/public/google-drive.png'
import gmailIcon from '@/public/gmail.png'
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
  const updateWorkflow = useUpdateWorkflow()

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [editWorkflowName, setEditWorkflowName] = useState('')
  const [editWorkflowDescription, setEditWorkflowDescription] = useState('')
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const nodesOptions = [
    { id: NODE_TYPES.GMAIL, name: 'Gmail', icon: gmailIcon },
    { id: NODE_TYPES.GOOGLE_DRIVE, name: 'Google Drive', icon: googleDriveIcon }
  ]

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
      setWorkflowName(workflow.name || '')
      setWorkflowDescription(workflow.description || '')
    }
  }, [data])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setNodes]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  )

  const addNode = (
    nodeType: typeof NODE_TYPES.GOOGLE_DRIVE | typeof NODE_TYPES.GMAIL
  ) => {
    // Generate unique node ID using timestamp
    const newNodeId = `n${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`
    const newNode: Node = {
      id: newNodeId,
      type: 'custom_node',
      position: { x: 280 + nodes.length * 200, y: 160 },
      data: {
        type: nodeType
      }
    }
    setNodes((nds) => [...nds, newNode])
    setSheetOpen(false)
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
    <div
      className='w-full h-screen relative flex flex-col'
      ref={reactFlowWrapper}
    >
      {/* Top Bar */}
      <div className='w-full h-16 border-b border-sidebar-border bg-sidebar z-10 flex items-center justify-between px-6'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.push('/workflows')}
            className='bg-sidebar-accent/50 hover:bg-sidebar-accent'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <h1 className='text-base font-semibold text-sidebar-foreground'>
            {workflowName || 'Untitled Workflow'}
          </h1>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-foreground'
            onClick={() => {
              setEditWorkflowName(workflowName || '')
              setEditWorkflowDescription(workflowDescription || '')
              setEditDialogOpen(true)
            }}
          >
            <Edit2 className='h-3.5 w-3.5' />
          </Button>
        </div>
        <Button
          size='sm'
          className='gap-2 min-w-20 items-center'
          onClick={handleSaveWorkflow}
          disabled={updateWorkflow.isPending || !workflowId}
        >
          <Save className='h-4 w-4' />
          Save
        </Button>
      </div>

      {/* Add Node Button - Top Middle Right */}
      <div className='absolute right-4 top-20 z-10'>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant='outline'
              size='lg'
              className='rounded-lg h-10 w-10 shadow-lg gap-0 border-2'
            >
              <Plus className='h-5 w-5 stroke-2' />
            </Button>
          </SheetTrigger>
          <SheetContent side='right' className='sm:max-w-md'>
            <SheetHeader>
              <SheetTitle className='text-lg font-semibold'>
                Select a Node
              </SheetTitle>
              <SheetDescription>
                Choose a node and configure it to perform various tasks
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

      {/* ReactFlow Canvas */}
      <div className='flex-1 relative'>
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

      {/* Edit Name & Description Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Edit2 className='h-5 w-5' />
              Edit Workflow
            </DialogTitle>
            <DialogDescription>
              Change the name or description of your workflow.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='edit-workflow-name'>Workflow Name</Label>
                <Input
                  id='edit-workflow-name'
                  placeholder='My Awesome Workflow'
                  value={editWorkflowName}
                  onChange={(e) => setEditWorkflowName(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      editWorkflowName.trim() &&
                      workflowId
                    ) {
                      handleUpdateDetails()
                    }
                  }}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-workflow-description'>Description</Label>
                <Textarea
                  id='edit-workflow-description'
                  placeholder='Describe what this workflow does'
                  value={editWorkflowDescription}
                  onChange={(e) => setEditWorkflowDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditDialogOpen(false)
                setEditWorkflowName('')
                setEditWorkflowDescription('')
              }}
              disabled={updateWorkflow.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDetails}
              disabled={
                updateWorkflow.isPending ||
                !editWorkflowName.trim() ||
                !workflowId
              }
              isLoading={updateWorkflow.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  function handleSaveWorkflow() {
    if (!workflowId) return

    updateWorkflow.mutate(
      {
        id: workflowId,
        data: {
          name: workflowName || undefined,
          description: workflowDescription || undefined,
          nodes,
          edges
        }
      },
      {
        onSuccess: () => {
          toast.success('Workflow updated successfully')
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to update workflow')
        }
      }
    )
  }

  function handleUpdateDetails() {
    if (!workflowId || !editWorkflowName.trim()) return

    const name = editWorkflowName.trim()
    const description = editWorkflowDescription.trim()

    updateWorkflow.mutate(
      {
        id: workflowId,
        data: {
          name,
          description: description || undefined,
          nodes,
          edges
        }
      },
      {
        onSuccess: () => {
          toast.success('Workflow updated successfully')
          setWorkflowName(name)
          setWorkflowDescription(description)
          setEditDialogOpen(false)
          setEditWorkflowName('')
          setEditWorkflowDescription('')
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to update workflow')
        }
      }
    )
  }
}
