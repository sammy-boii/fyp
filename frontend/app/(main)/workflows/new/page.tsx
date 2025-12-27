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

import Image from 'next/image'
import { ChevronRight, Save } from 'lucide-react'
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
  const [workflowName, setWorkflowName] = useState('')
  const createWorkflow = useCreateWorkflow()

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
    const newNodeId = `n${nodes.length + 1}`
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
    <div className='w-full h-screen relative'>
      {/* Save Button */}
      <div className='absolute top-4 right-4 z-10'>
        <Button
          onClick={() => setSaveDialogOpen(true)}
          className='gap-2'
          disabled={createWorkflow.isPending}
        >
          <Save className='h-4 w-4' />
          Save Workflow
        </Button>
      </div>

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
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        {nodes.length === 0 && (
          <SheetTrigger asChild>
            <div className='cursor-pointer absolute text-muted-foreground left-1/2 top-1/2 -translate-x-1/2 flex items-center flex-col gap-3 -translate-y-1/2'>
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
            <DialogTitle>Save Workflow</DialogTitle>
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
    </div>
  )
}
