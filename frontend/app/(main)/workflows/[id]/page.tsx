'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  ConnectionLineType,
  addEdge,
  Connection,
  useReactFlow,
  ReactFlowProvider,
  useOnSelectionChange
} from '@xyflow/react'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

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
import { EmptyWorkflowPlaceholder } from './_components/EmptyWorkflowPlaceholder'
import MorphingInput from './_components/AIPromptInput'
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
import { ALL_NODE_TYPES } from '@/constants'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { generateWorkflowFromPrompt } from '@/actions/workflow.actions'
import {
  NODE_DEFINITIONS,
  TRIGGER_NODE_DEFINITIONS
} from '@/constants/registry'
import WorkflowExecutionTab from './_components/WorkflowExecutionTab'
import { NodeContextMenu } from './_components/NodeContextMenu'
import { DeleteNodesDialog } from './_components/DeleteNodesDialog'
import { UnsavedChangesDialog } from './_components/UnsavedChangesDialog'
import { useWorkflowWebSocket } from '@/hooks/use-workflow-websocket'
import { WorkflowEditorProvider } from './_context/WorkflowEditorContext'
import DropletLoader from '@/components/animation/DropletLoader'
import WorkflowLoader from '@/components/animation/WorkflowLoader'

export default function WorkflowViewPage() {
  return (
    <ReactFlowProvider>
      <WorkflowViewPageInner />
    </ReactFlowProvider>
  )
}

interface AIWorkflowResponse {
  nodes: Node[]
  edges: Edge[]
  error?: string
}

function WorkflowViewPageInner() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params?.id ? String(params.id) : null
  const reactFlowInstance = useReactFlow()

  const { data, isLoading, isError, error } = useGetWorkflow(workflowId)
  const updateWorkflow = useUpdateWorkflow()

  const executeWorkflow = useExecuteWorkflow()

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isExecutingNode, setIsExecutingNode] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'executions'>('editor')
  const [hasNewExecution, setHasNewExecution] = useState(false)
  const [isTogglingActive, setIsTogglingActive] = useState(false)
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([])
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
  } | null>(null)
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] =
    useState(false)
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null)
  const [isSavingAndLeaving, setIsSavingAndLeaving] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const lastExecutionIdRef = useRef<string | null>(null)
  const hasInitialized = useRef(false)
  const initialStateRef = useRef<{
    nodesHash: string
    edgesHash: string
    name: string
    description: string
  } | null>(null)

  // Track selected nodes
  useOnSelectionChange({
    onChange: ({ nodes: selectedNodesList }) => {
      setSelectedNodes(selectedNodesList)
    }
  })

  // Handle pane context menu (right-click on canvas)
  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
      // Only show context menu if there are selected nodes (excluding trigger nodes)
      const deletableNodes = selectedNodes.filter(
        (n) => n.type !== 'trigger_node'
      )
      if (deletableNodes.length > 0) {
        event.preventDefault()
        setContextMenu({ x: event.clientX, y: event.clientY })
      }
    },
    [selectedNodes]
  )

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  // Delete selected nodes
  const handleDeleteSelectedNodes = useCallback(() => {
    // Filter out trigger nodes - they shouldn't be deleted
    const nodesToDelete = selectedNodes.filter((n) => n.type !== 'trigger_node')
    const nodeIdsToDelete = new Set(nodesToDelete.map((n) => n.id))

    // Remove nodes
    setNodes((nds) => nds.filter((n) => !nodeIdsToDelete.has(n.id)))

    // Remove edges connected to deleted nodes
    setEdges((eds) =>
      eds.filter(
        (e) => !nodeIdsToDelete.has(e.source) && !nodeIdsToDelete.has(e.target)
      )
    )

    setContextMenu(null)
  }, [selectedNodes, setNodes, setEdges])

  // Stable normalization prevents false dirty states caused by key or array ordering.
  const normalizeForHash = useCallback((value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) => normalizeForHash(item))
    }

    if (value && typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce(
          (acc, key) => {
            acc[key] = normalizeForHash((value as Record<string, unknown>)[key])
            return acc
          },
          {} as Record<string, unknown>
        )
    }

    return value
  }, [])

  // Helper to extract comparable node data (excludes transient properties)
  const getNodesHash = useCallback(
    (nodes: Node[]) => {
      return JSON.stringify(
        nodes
          .map((n) => ({
            id: n.id,
            type: n.type,
            data: {
              type: n.data.type,
              actionId: n.data.actionId,
              config: normalizeForHash(n.data.config)
            }
          }))
          .sort((a, b) => a.id.localeCompare(b.id))
      )
    },
    [normalizeForHash]
  )

  // Helper to extract comparable edge data
  const getEdgesHash = useCallback((edges: Edge[]) => {
    return JSON.stringify(
      edges
        .map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target
        }))
        .sort((a, b) =>
          `${a.id}:${a.source}:${a.target}`.localeCompare(
            `${b.id}:${b.source}:${b.target}`
          )
        )
    )
  }, [])

  const getIsWorkflowDirty = useCallback(
    (
      nodesToCheck: Node[],
      edgesToCheck: Edge[],
      nameToCheck: string,
      descriptionToCheck: string
    ) => {
      const currentNodesHash = getNodesHash(nodesToCheck)
      const currentEdgesHash = getEdgesHash(edgesToCheck)

      return (
        !initialStateRef.current ||
        currentNodesHash !== initialStateRef.current.nodesHash ||
        currentEdgesHash !== initialStateRef.current.edgesHash ||
        nameToCheck !== initialStateRef.current.name ||
        descriptionToCheck !== initialStateRef.current.description
      )
    },
    [getNodesHash, getEdgesHash]
  )

  const hasUnsavedChanges = getIsWorkflowDirty(
    nodes,
    edges,
    workflowName,
    workflowDescription
  )

  const clearExecutionNodeState = useCallback(() => {
    setExecutingNodeId(null)
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isExecuting: false,
          lastStatus: undefined,
          lastOutput: undefined,
          lastExecutedAt: undefined
        }
      }))
    )
  }, [])

  // WebSocket for live execution updates
  const { isConnected, executionLogs, currentExecution, clearLogs } =
    useWorkflowWebSocket(workflowId, {
      onWorkflowStart: () => {
        // Reset previous run markers as soon as a new execution starts.
        clearExecutionNodeState()
      },
      onNodeStart: (nodeId) => {
        setExecutingNodeId(nodeId)
        // Update node data to show executing state
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isExecuting: n.id === nodeId,
              lastStatus: n.id === nodeId ? undefined : n.data.lastStatus
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
              lastStatus: n.id === nodeId ? 'completed' : n.data.lastStatus,
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
              isExecuting: false,
              lastStatus: n.id === nodeId ? 'failed' : n.data.lastStatus
            }
          }))
        )
      },
      onWorkflowComplete: () => {
        setExecutingNodeId(null)
        // Keep completion markers but stop loading state.
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
        // Keep failure markers but stop loading state.
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
    })

  const nodeActionIdById = useMemo(() => {
    const map: Record<string, string> = {}
    nodes.forEach((node) => {
      const actionId = (node as any)?.data?.actionId
      if (node?.id && typeof actionId === 'string' && actionId) {
        map[node.id] = actionId
      }
    })
    return map
  }, [nodes])

  const stripTransientNodeState = useCallback((nodesToStrip: Node[]) => {
    let didChange = false
    const sanitized = nodesToStrip.map((node) => {
      if (!node?.data) {
        return node
      }
      if (
        node.data.lastStatus === undefined &&
        node.data.isExecuting === undefined
      ) {
        return node
      }
      didChange = true
      return {
        ...node,
        data: {
          ...node.data,
          lastStatus: undefined,
          isExecuting: undefined
        }
      }
    })

    return { sanitized, didChange }
  }, [])

  const validateWorkflowForPersist = useCallback(
    (nodesToValidate: Node[], edgesToValidate: Edge[]) => {
      const connectedNodeIds = new Set<string>()
      edgesToValidate.forEach((edge) => {
        if (edge.source) connectedNodeIds.add(edge.source)
        if (edge.target) connectedNodeIds.add(edge.target)
      })

      const getNodeLabel = (node: Node) => {
        const type = (node as any)?.data?.type as string | undefined
        if (!type) return node.id

        if (node.type === 'trigger_node') {
          return (TRIGGER_NODE_DEFINITIONS as any)[type]?.label ?? type
        }

        return (NODE_DEFINITIONS as any)[type]?.label ?? type
      }

      const isTriggerNode = (node: Node) => {
        const nodeType = (node as any)?.data?.type as string | undefined
        return Boolean(
          node.type === 'trigger_node' ||
          (nodeType && (TRIGGER_NODE_DEFINITIONS as any)[nodeType])
        )
      }

      const missingActionNodes: string[] = []
      const standaloneNodes: string[] = []

      nodesToValidate.forEach((node) => {
        const label = getNodeLabel(node)
        const actionId = (node as any)?.data?.actionId as string | undefined

        if (!actionId) {
          missingActionNodes.push(label)
        }

        if (!connectedNodeIds.has(node.id)) {
          standaloneNodes.push(label)
        }
      })

      const formatNodeList = (items: string[]) => {
        const unique = Array.from(new Set(items))
        const maxItems = 3
        if (unique.length <= maxItems) {
          return unique.join(', ')
        }
        return `${unique.slice(0, maxItems).join(', ')} (+${unique.length - maxItems} more)`
      }

      if (missingActionNodes.length > 0) {
        return {
          ok: false,
          message: `Select an action for: ${formatNodeList(missingActionNodes)}`
        } as const
      }

      if (nodesToValidate.length === 1) {
        if (!isTriggerNode(nodesToValidate[0])) {
          return {
            ok: false,
            message: 'A single-node workflow must use a trigger node'
          } as const
        }

        return { ok: true } as const
      }

      if (standaloneNodes.length > 0) {
        return {
          ok: false,
          message: `Connect or delete standalone nodes: ${formatNodeList(standaloneNodes)}`
        } as const
      }

      return { ok: true } as const
    },
    []
  )

  const displayEdges = useMemo(() => {
    if (!executingNodeId) {
      return edges
    }

    return edges.map((edge) => {
      const isActive = edge.source === executingNodeId

      if (!isActive) {
        return edge
      }

      const className = edge.className
        ? `${edge.className} edge-flowing`
        : 'edge-flowing'

      return {
        ...edge,
        className
      }
    })
  }, [edges, executingNodeId])

  useEffect(() => {
    if (!currentExecution?.id) return

    if (currentExecution.id !== lastExecutionIdRef.current) {
      lastExecutionIdRef.current = currentExecution.id
      if (activeTab !== 'executions') {
        setHasNewExecution(true)
      }
    }
  }, [currentExecution?.id, activeTab])

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
      const { sanitized: sanitizedNodes } =
        stripTransientNodeState(formattedNodes)

      setNodes(sanitizedNodes)
      setEdges(formattedEdges)
      setWorkflowName(workflow.name || '')
      setWorkflowDescription(workflow.description || '')
      setIsActive(workflow.isActive || false)
      hasInitialized.current = true
      // Store initial state hashes for change detection
      initialStateRef.current = {
        nodesHash: getNodesHash(sanitizedNodes),
        edgesHash: getEdgesHash(formattedEdges),
        name: workflow.name || '',
        description: workflow.description || ''
      }
    }
  }, [data, stripTransientNodeState, getNodesHash, getEdgesHash])

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  // Validate connection: prevent self-connections and connections to nodes that already have an incoming edge
  // Also handle condition nodes which can have multiple outputs (one per handle)
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      // Prevent self-connections
      if (connection.source === connection.target) {
        return false
      }

      // Check if target already has an incoming edge
      const targetHasIncoming = edges.some(
        (edge) => edge.target === connection.target
      )
      if (targetHasIncoming) {
        return false
      }

      // For condition nodes, check if the specific handle already has a connection
      if (connection.sourceHandle) {
        const handleHasConnection = edges.some(
          (edge) =>
            edge.source === connection.source &&
            edge.sourceHandle === connection.sourceHandle
        )
        if (handleHasConnection) {
          return false
        }
      } else {
        // For non-condition nodes (no sourceHandle), check if source already has any outgoing edge
        const sourceNode = nodes.find((n) => n.id === connection.source)
        if (sourceNode?.type !== 'condition_node') {
          const sourceHasOutgoing = edges.some(
            (edge) => edge.source === connection.source
          )
          if (sourceHasOutgoing) {
            return false
          }
        }
      }

      return true
    },
    [edges, nodes]
  )

  // Handle new connections from manual edge dragging
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = createEdge(connection.source!, connection.target!)
      // Preserve the sourceHandle for condition nodes
      if (connection.sourceHandle) {
        newEdge.sourceHandle = connection.sourceHandle
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges]
  )

  const addNode = (nodeType: ValueOf<typeof ALL_NODE_TYPES>) => {
    // Find the last node in the chain
    const lastNode = findLastNode(nodes, edges)

    let newPosition

    if (lastNode) {
      // If there's a last node, position to the right of it
      newPosition = calculateNewNodePosition(nodes, edges, {
        fromNode: lastNode
      })
    } else {
      // If no nodes exist, position at viewport center
      const { getViewport } = reactFlowInstance
      const viewport = getViewport()
      const wrapperBounds = reactFlowWrapper.current?.getBoundingClientRect()

      if (wrapperBounds) {
        // Calculate center of visible viewport
        const centerX = (wrapperBounds.width / 2 - viewport.x) / viewport.zoom
        const centerY = (wrapperBounds.height / 2 - viewport.y) / viewport.zoom
        newPosition = { x: centerX - 96, y: centerY - 50 } // Offset for node size
      } else {
        newPosition = calculateNewNodePosition(nodes, edges, {})
      }
    }

    // Create the new node using utility function
    const newNode = createNode(nodeType, newPosition)

    // Add the new node
    setNodes((nds) => [...nds, newNode])

    // If there's a last node, create an edge from it to the new node
    // Skip auto-connect for condition nodes since they have true/false handles
    if (lastNode && lastNode.type !== 'condition_node') {
      const newEdge = createEdge(lastNode.id, newNode.id)
      setEdges((eds) => addEdge(newEdge, eds))
    }

    setSheetOpen(false)
  }

  // Handler for AI-generated workflow
  const handleAIWorkflowGenerated = useCallback(
    (aiNodes: Node[], aiEdges: Edge[]) => {
      // Replace current nodes and edges with AI-generated ones
      setNodes(aiNodes)
      setEdges(aiEdges)

      // Fit view to show all nodes after a short delay
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 })
      }, 100)
    },
    [setNodes, setEdges, reactFlowInstance]
  )

  const handleAiPromptSend = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isAIGenerating || isExecuting) return

      setIsAIGenerating(true)
      try {
        const result = await generateWorkflowFromPrompt(prompt.trim())

        if (result.error) {
          throw new Error(result.error)
        }

        const data = result.data as AIWorkflowResponse

        if (data?.nodes && data.nodes.length > 0) {
          handleAIWorkflowGenerated(data.nodes, data.edges || [])
          toast.success(`Generated workflow with ${data.nodes.length} nodes`)
        } else {
          throw new Error('No nodes generated')
        }
      } catch (error) {
        console.error('AI generation error:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to generate workflow'
        )
      } finally {
        setIsAIGenerating(false)
      }
    },
    [handleAIWorkflowGenerated, isAIGenerating, isExecuting]
  )

  const handleExecuteWorkflow = useCallback(async () => {
    // Prevent double execution or execution during node execution
    if (
      !workflowId ||
      executeWorkflow.isPending ||
      isExecuting ||
      isExecutingNode
    )
      return

    const { toast } = await import('sonner')

    const { sanitized, didChange } = stripTransientNodeState(nodes)
    if (didChange) {
      setNodes(sanitized)
    }

    const validation = validateWorkflowForPersist(sanitized, edges)
    if (!validation.ok) {
      toast.error(validation.message)
      return
    }

    setIsExecuting(true)
    try {
      // Clear old run status markers before starting a fresh execution.
      clearExecutionNodeState()

      // Check if workflow has changed before auto-saving
      const currentNodesHash = getNodesHash(sanitized)
      const currentEdgesHash = getEdgesHash(edges)
      const hasChanges =
        !initialStateRef.current ||
        currentNodesHash !== initialStateRef.current.nodesHash ||
        currentEdgesHash !== initialStateRef.current.edgesHash ||
        workflowName !== initialStateRef.current.name ||
        workflowDescription !== initialStateRef.current.description

      if (hasChanges) {
        // Auto-save workflow before executing
        await updateWorkflow.mutateAsync({
          id: workflowId,
          data: {
            name: workflowName,
            description: workflowDescription,
            nodes: sanitized as unknown as any[],
            edges: edges as unknown as any[]
          }
        })
        // Update initial state after save
        initialStateRef.current = {
          nodesHash: currentNodesHash,
          edgesHash: currentEdgesHash,
          name: workflowName,
          description: workflowDescription
        }
      }

      await executeWorkflow.mutateAsync(workflowId)
    } finally {
      setIsExecuting(false)
    }
  }, [
    workflowId,
    executeWorkflow,
    updateWorkflow,
    workflowName,
    workflowDescription,
    nodes,
    edges,
    isExecuting,
    isExecutingNode,
    getNodesHash,
    getEdgesHash,
    clearExecutionNodeState,
    stripTransientNodeState,
    validateWorkflowForPersist
  ])

  const handleSaveWorkflow = useCallback(async () => {
    if (!workflowId) return

    const { toast } = await import('sonner')
    const { sanitized, didChange } = stripTransientNodeState(nodes)

    if (didChange) {
      setNodes(sanitized)
    }

    const validation = validateWorkflowForPersist(sanitized, edges)
    if (!validation.ok) {
      toast.error(validation.message)
      return
    }

    try {
      // Save workflow data (including isActive - updateWorkflow will handle cache update)
      await updateWorkflow.mutateAsync({
        id: workflowId,
        data: {
          name: workflowName,
          description: workflowDescription,
          nodes: sanitized as unknown as any[],
          edges: edges as unknown as any[],
          isActive
        }
      })

      const currentNodesHash = getNodesHash(sanitized)
      const currentEdgesHash = getEdgesHash(edges)
      initialStateRef.current = {
        nodesHash: currentNodesHash,
        edgesHash: currentEdgesHash,
        name: workflowName,
        description: workflowDescription
      }

      toast.success('Workflow saved')
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to save workflow')
      return false
    }
  }, [
    workflowId,
    workflowName,
    workflowDescription,
    nodes,
    edges,
    isActive,
    updateWorkflow,
    getNodesHash,
    getEdgesHash,
    stripTransientNodeState,
    validateWorkflowForPersist
  ])

  const requestNavigation = useCallback(
    (navigate: () => void) => {
      if (hasUnsavedChanges) {
        setPendingNavigation(() => navigate)
        setLeaveConfirmationOpen(true)
        return
      }

      navigate()
    },
    [hasUnsavedChanges]
  )

  const handleBackNavigation = useCallback(() => {
    requestNavigation(() => router.push('/workflows'))
  }, [requestNavigation, router])

  const handleLeaveWithoutSaving = useCallback(() => {
    const nextNavigation = pendingNavigation
    setLeaveConfirmationOpen(false)
    setPendingNavigation(null)
    nextNavigation?.()
  }, [pendingNavigation])

  const handleSaveAndLeave = useCallback(async () => {
    if (!pendingNavigation) {
      return
    }

    setIsSavingAndLeaving(true)
    const saved = await handleSaveWorkflow()
    setIsSavingAndLeaving(false)

    if (!saved) {
      return
    }

    const nextNavigation = pendingNavigation
    setLeaveConfirmationOpen(false)
    setPendingNavigation(null)
    nextNavigation()
  }, [pendingNavigation, handleSaveWorkflow])

  useEffect(() => {
    const handleBeforeUnload = (evt: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return
      }

      evt.preventDefault()
      evt.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    const handleDocumentNavigation = (event: MouseEvent) => {
      if (!hasUnsavedChanges || event.defaultPrevented) {
        return
      }

      if (event.button !== 0) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) {
        return
      }

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) {
        return
      }

      if (anchor.target && anchor.target !== '_self') {
        return
      }

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) {
        return
      }

      const currentUrl =
        window.location.pathname + window.location.search + window.location.hash
      const nextUrl = url.pathname + url.search + url.hash

      if (currentUrl === nextUrl) {
        return
      }

      event.preventDefault()
      requestNavigation(() => router.push(nextUrl))
    }

    document.addEventListener('click', handleDocumentNavigation, true)
    return () => {
      document.removeEventListener('click', handleDocumentNavigation, true)
    }
  }, [hasUnsavedChanges, requestNavigation, router])

  const handleToggleActive = useCallback((active: boolean) => {
    setIsActive(active)
  }, [])

  if (isLoading) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <DropletLoader />
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
                data?.error ||
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
    <WorkflowEditorProvider
      workflowId={workflowId!}
      workflowName={workflowName}
      workflowDescription={workflowDescription}
      hasUnsavedChanges={hasUnsavedChanges}
      initialStateRef={initialStateRef}
      getNodesHash={getNodesHash}
      getEdgesHash={getEdgesHash}
      isExecutingWorkflow={executeWorkflow.isPending || isExecuting}
      isExecutingNode={isExecutingNode}
      setIsExecutingNode={setIsExecutingNode}
      isTogglingActive={isTogglingActive}
      setIsTogglingActive={setIsTogglingActive}
    >
      <div className='relative flex flex-col h-screen'>
        {/* Top Bar */}
        <WorkflowHeader
          workflowName={workflowName}
          workflowDescription={workflowDescription}
          onBack={handleBackNavigation}
          onEdit={() => setEditDialogOpen(true)}
          onSave={handleSaveWorkflow}
          isSaving={updateWorkflow.isPending}
          workflowId={workflowId}
          onExecute={handleExecuteWorkflow}
          isExecuting={executeWorkflow.isPending || isExecuting}
          isActive={isActive}
          onToggleActive={handleToggleActive}
          isTogglingActive={isTogglingActive}
          isWorkflowEmpty={nodes.length === 0}
          isManualTrigger={nodes.some((n) => n.data?.actionId === 'on_demand')}
        />

        {/* Edit Workflow Dialog */}
        <EditWorkflowDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          workflowName={workflowName}
          workflowDescription={workflowDescription}
          workflowId={workflowId}
          onNameChange={setWorkflowName}
          onDescriptionChange={setWorkflowDescription}
        />

        <UnsavedChangesDialog
          open={leaveConfirmationOpen}
          onOpenChange={setLeaveConfirmationOpen}
          onLeaveWithoutSaving={handleLeaveWithoutSaving}
          onSaveAndLeave={handleSaveAndLeave}
          isSavingAndLeaving={isSavingAndLeaving}
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as 'editor' | 'executions')
            if (value === 'executions') {
              setHasNewExecution(false)
            }
          }}
        >
          <TabsList className='absolute left-1/2 top-8 -translate-x-1/2 z-10'>
            <TabsTrigger value='editor'>Editor</TabsTrigger>
            <TabsTrigger value='executions' className='relative'>
              Executions
              {hasNewExecution && activeTab !== 'executions' ? (
                <>
                  <span
                    aria-hidden='true'
                    className='absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_2px] shadow-background animate-pulse'
                  />
                  <span className='sr-only'>New execution in progress</span>
                </>
              ) : null}
            </TabsTrigger>
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
                    showOnlyTriggers={nodes.length === 0}
                    showOnlyActions={nodes.length > 0}
                  />
                </Sheet>
              </div>

              {/* Empty workflow placeholder - show only when no nodes */}
              {nodes.length === 0 && (
                <EmptyWorkflowPlaceholder
                  isAIGenerating={isAIGenerating}
                  onAddNode={addNode}
                />
              )}

              <ReactFlow
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                isValidConnection={isValidConnection}
                nodes={nodes}
                edges={displayEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                className='bg-background'
                connectionLineType={ConnectionLineType.Bezier}
                defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
                fitView
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
                onPaneContextMenu={onPaneContextMenu}
              >
                <Background gap={40} />
              </ReactFlow>

              {/* AI Generation overlay */}
              {isAIGenerating && (
                <div className='absolute inset-0 z-1 flex items-center justify-center bg-background/10 backdrop-blur-sm'>
                  <WorkflowLoader text='GENERATING WORKFLOW' />
                </div>
              )}

              {/* AI Prompt Input */}
              <MorphingInput
                onSend={handleAiPromptSend}
                placeholder='Describe your workflow...'
              />

              {/* Context menu for selected nodes */}
              {contextMenu && (
                <NodeContextMenu
                  position={contextMenu}
                  selectedNodes={selectedNodes}
                  onDelete={() => setDeleteSelectedDialogOpen(true)}
                  onClose={() => setContextMenu(null)}
                />
              )}

              {/* Delete selected nodes confirmation dialog */}
              <DeleteNodesDialog
                open={deleteSelectedDialogOpen}
                onOpenChange={setDeleteSelectedDialogOpen}
                selectedNodes={selectedNodes}
                onConfirm={handleDeleteSelectedNodes}
              />
            </div>
          </TabsContent>
          <TabsContent value='executions' className='flex-1'>
            <WorkflowExecutionTab
              isConnected={isConnected}
              executionLogs={executionLogs}
              currentExecution={currentExecution}
              clearLogs={clearLogs}
              nodeActionIdById={nodeActionIdById}
            />
          </TabsContent>
        </Tabs>
      </div>
    </WorkflowEditorProvider>
  )
}
