'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  Edge,
  ConnectionLineType
} from '@xyflow/react'

import Image from 'next/image'
import { ChevronRight, Save, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import type {
  Node,
  OnConnect,
  OnEdgesChange,
  OnNodesChange
} from '@xyflow/react'

import { nodeTypes, edgeTypes } from '@/types/node.types'

import { NODE_TYPES } from '@/constants'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import googleDriveIcon from '@/public/google-drive.png'
import gmailIcon from '@/public/gmail.png'
import { useCreateWorkflow } from '@/hooks/use-workflows'
import { toast } from 'sonner'

const nodesOptions = [
  { id: NODE_TYPES.GMAIL, name: 'Gmail', icon: gmailIcon },
  { id: NODE_TYPES.GOOGLE_DRIVE, name: 'Google Drive', icon: googleDriveIcon }
]

export default function WorkflowPage() {
  const router = useRouter()
  const initialNodes: Node[] = []

  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState<Edge[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [editWorkflowName, setEditWorkflowName] = useState('')
  const createWorkflow = useCreateWorkflow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

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
  const onConnect: OnConnect = useCallback(
    (connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
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

  const handleSave = () => {
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name')
      return
    }

    if (nodes.length === 0) {
      toast.error('Please add at least one node to the workflow')
      return
    }

    createWorkflow.mutate(
      {
        name: workflowName.trim(),
        nodes,
        edges,
        status: 'inactive'
      },
      {
        onSuccess: (result) => {
          if (result?.data) {
            toast.success('Workflow saved successfully')
            router.push('/workflows')
          } else if (result?.error) {
            toast.error(result.error.message || 'Failed to save workflow')
          }
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to save workflow')
        }
      }
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
          <h1 className='text-base font-semibold text-sidebar-foreground'>
            {workflowName || 'New Workflow'}
          </h1>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-foreground'
            onClick={() => {
              setEditWorkflowName(workflowName)
              setEditDialogOpen(true)
            }}
          >
            <Edit2 className='h-3.5 w-3.5' />
          </Button>
        </div>
        <Button
          onClick={() => setSaveDialogOpen(true)}
          size='sm'
          className='gap-2'
          disabled={createWorkflow.isPending}
        >
          <Save className='h-3.5 w-3.5' />
          Save Workflow
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

      <div className='flex-1 relative'>
        <ReactFlow
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
        >
          <Background gap={40} />
        </ReactFlow>
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        {nodes.length === 0 && (
          <SheetTrigger asChild>
            <div className='cursor-pointer absolute text-muted-foreground left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center flex-col gap-3 z-10'>
              <div className='p-7 border-dashed border-muted border-3 rounded-md'>
                <Plus className='stroke-3 size-7' />
              </div>
              <span className='text-xs font-semibold'>Add first node...</span>
            </div>
          </SheetTrigger>
        )}
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
                    <span className='text-sm font-semibold'>{option.name}</span>
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

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Save className='h-5 w-5' />
              Save Workflow
            </DialogTitle>
            <DialogDescription>
              Give your workflow a name to save it.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='workflow-name'>Workflow Name</Label>
              <Input
                id='workflow-name'
                placeholder='My Awesome Workflow'
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setSaveDialogOpen(false)
                setWorkflowName('')
              }}
              disabled={createWorkflow.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createWorkflow.isPending || !workflowName.trim()}
            >
              {createWorkflow.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Edit2 className='h-5 w-5' />
              Edit Workflow Name
            </DialogTitle>
            <DialogDescription>
              Change the name of your workflow.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-workflow-name'>Workflow Name</Label>
              <Input
                id='edit-workflow-name'
                placeholder='My Awesome Workflow'
                value={editWorkflowName}
                onChange={(e) => setEditWorkflowName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setWorkflowName(editWorkflowName)
                    setEditDialogOpen(false)
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditDialogOpen(false)
                setEditWorkflowName('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setWorkflowName(editWorkflowName)
                setEditDialogOpen(false)
              }}
              disabled={!editWorkflowName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
