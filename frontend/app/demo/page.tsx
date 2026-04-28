'use client'

import { AddNodeSheetContent } from '@/app/(main)/workflows/[id]/_components/AddNodeSheet'
import { EmptyWorkflowPlaceholder } from '@/app/(main)/workflows/[id]/_components/EmptyWorkflowPlaceholder'
import WorkflowExecutionTab from '@/app/(main)/workflows/[id]/_components/WorkflowExecutionTab'
import { WorkflowHeader } from '@/app/(main)/workflows/[id]/_components/WorkflowHeader'
import { WorkflowEditorProvider } from '@/app/(main)/workflows/[id]/_context/WorkflowEditorContext'
import { ALL_NODE_TYPES, TRIGGER_NODE_TYPES } from '@/constants'
import { MarsColonyScene } from '@/components/demo/mars-colony-scene'
import { Button } from '@/components/ui/button'
import {
  NODE_DEFINITIONS,
  TRIGGER_NODE_DEFINITIONS
} from '@/constants/registry'
import type { ExecutionLog } from '@/hooks/use-workflow-websocket'
import { createDemoWorkflowAdapter } from '@/lib/demo-workflow-mocks'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSmoothScroll } from '@/hooks/use-smooth-scroll'
import {
  DEFAULT_EDGE_OPTIONS,
  calculateNewNodePosition,
  createEdge,
  createNode,
  findLastNode
} from '@/lib/react-flow-utils'
import { nodeTypes, edgeTypes } from '@/types/node.types'
import { ValueOf } from '@/types/index.types'
import {
  Background,
  Connection,
  ConnectionLineType,
  Edge,
  Node,
  OnEdgesChange,
  OnNodesChange,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Bot,
  CircuitBoard,
  Network,
  Plus,
  Radar,
  ShieldCheck,
  Workflow,
  type LucideIcon
} from 'lucide-react'
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride'
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { toast } from 'sonner'
import './demo.css'

gsap.registerPlugin(ScrollTrigger)

interface Capability {
  title: string
  description: string
  icon: LucideIcon
}

interface WorkflowStep {
  title: string
  description: string
}

const capabilityCards: Capability[] = [
  {
    title: 'Visual Workflow Builder',
    description:
      'Design powerful automations with an intuitive drag-and-drop interface. No coding required.',
    icon: Workflow
  },
  {
    title: 'Real-time Execution Tracking',
    description:
      'Watch your workflows execute in real-time with live logs, status updates, and detailed execution history.',
    icon: Radar
  },
  {
    title: 'Smart Error Recovery',
    description:
      'Automatically handle errors, retry failed steps, and recover gracefully when things go wrong.',
    icon: ShieldCheck
  }
]

const workflowSteps: WorkflowStep[] = [
  {
    title: 'Design your automation',
    description:
      'Start with a trigger like receiving an email or a webhook. Add actions in sequence to build your workflow.'
  },
  {
    title: 'Connect your apps',
    description:
      'Integrate with Gmail, Google Drive, Discord, and more. Authenticate once and access all your tools.'
  },
  {
    title: 'Set up logic & conditions',
    description:
      'Add conditional branches to make decisions. Route tasks to different paths based on your rules.'
  },
  {
    title: 'Deploy & monitor',
    description:
      'Activate your workflow and let it run automatically. Monitor execution logs and adjust as needed.'
  }
]

const metrics = [
  {
    value: '10x',
    label: 'faster than manual work'
  },
  {
    value: '98.89%',
    label: 'platform uptime across workflow runs'
  },
  {
    value: '50ms',
    label: 'average workflow response latency'
  }
]

const DEMO_BACKGROUND = 'rgb(4, 10, 23)'
const HERO_TITLE = 'Complexity is inevitable. Friction is optional.'
const TV_TRANSITION_SWAP_DELAY_MS = 1760
const TV_TRANSITION_TOTAL_MS = 3120

const normalizeDemoValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDemoValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = normalizeDemoValue((value as Record<string, unknown>)[key])
          return acc
        },
        {} as Record<string, unknown>
      )
  }

  return value
}

const getDemoNodesHash = (nodesToHash: Node[]) => {
  return JSON.stringify(
    nodesToHash
      .map((node) => ({
        id: node.id,
        type: node.type,
        data: {
          type: node.data?.type,
          actionId: node.data?.actionId,
          config: normalizeDemoValue(node.data?.config)
        },
        position: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y)
        }
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  )
}

const getDemoEdgesHash = (edgesToHash: Edge[]) => {
  return JSON.stringify(
    edgesToHash
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  )
}

const createDemoWorkflowSeed = () => {
  return {
    nodes: [] as Node[],
    edges: [] as Edge[]
  }
}

interface DemoWorkflowShowcaseProps {
  onBack: () => void
  startWalkthrough: boolean
}

function DemoWorkflowShowcase({
  onBack,
  startWalkthrough
}: DemoWorkflowShowcaseProps) {
  return (
    <ReactFlowProvider>
      <DemoWorkflowShowcaseInner
        onBack={onBack}
        startWalkthrough={startWalkthrough}
      />
    </ReactFlowProvider>
  )
}

function DemoWorkflowShowcaseInner({
  onBack,
  startWalkthrough
}: DemoWorkflowShowcaseProps) {
  const reactFlowInstance = useReactFlow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const demoSeed = useMemo(() => createDemoWorkflowSeed(), [])
  const demoAdapter = useMemo(() => createDemoWorkflowAdapter(), [])

  const [nodes, setNodes] = useState<Node[]>(demoSeed.nodes)
  const [edges, setEdges] = useState<Edge[]>(demoSeed.edges)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'executions'>('editor')
  const [isActive, setIsActive] = useState(true)
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false)
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false)
  const [isExecutingNode, setIsExecutingNode] = useState(false)
  const [isTogglingActive, setIsTogglingActive] = useState(false)
  const [isWalkthroughRunning, setIsWalkthroughRunning] = useState(false)
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null)
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([])
  const [currentExecution, setCurrentExecution] = useState<{
    id: string
    status: 'running' | 'completed' | 'failed'
    progress?: { current: number; total: number }
  } | null>(null)
  const walkthroughStartTimerRef = useRef<number | null>(null)
  const executionRunIdRef = useRef(0)

  const initialStateRef = useRef({
    nodesHash: getDemoNodesHash(demoSeed.nodes),
    edgesHash: getDemoEdgesHash(demoSeed.edges),
    name: 'Welcome Sequence',
    description: 'Demo workflow preview',
    isActive: true
  })

  const hasUnsavedChanges = useMemo(() => {
    return (
      getDemoNodesHash(nodes) !== initialStateRef.current.nodesHash ||
      getDemoEdgesHash(edges) !== initialStateRef.current.edgesHash ||
      isActive !== initialStateRef.current.isActive
    )
  }, [edges, isActive, nodes])
  const isWorkflowEmpty = nodes.length === 0
  const isManualTrigger = nodes.some(
    (node) => node.data?.type === TRIGGER_NODE_TYPES.MANUAL_TRIGGER
  )
  const nodeActionIdById = useMemo(() => {
    const map: Record<string, string> = {}
    nodes.forEach((node) => {
      const actionId = node.data?.actionId
      if (node.id && typeof actionId === 'string' && actionId) {
        map[node.id] = actionId
      }
    })
    return map
  }, [nodes])

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes))
  }, [])

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges))
  }, [])

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (connection.source === connection.target) {
        return false
      }

      const targetHasIncoming = edges.some(
        (edge) => edge.target === connection.target
      )
      if (targetHasIncoming) {
        return false
      }

      if (connection.sourceHandle) {
        const handleHasConnection = edges.some(
          (edge) =>
            edge.source === connection.source &&
            edge.sourceHandle === connection.sourceHandle
        )
        return !handleHasConnection
      }

      const sourceNode = nodes.find((node) => node.id === connection.source)
      if (sourceNode?.type !== 'condition_node') {
        const sourceHasOutgoing = edges.some(
          (edge) => edge.source === connection.source
        )
        if (sourceHasOutgoing) {
          return false
        }
      }

      return true
    },
    [edges, nodes]
  )

  const getNodeLabel = useCallback((node: Node) => {
    const type = node.data?.type as string | undefined

    if (!type) {
      return node.id
    }

    if (node.type === 'trigger_node') {
      return (
        (TRIGGER_NODE_DEFINITIONS as Record<string, { label?: string }>)[type]
          ?.label ?? type
      )
    }

    return (
      (NODE_DEFINITIONS as Record<string, { label?: string }>)[type]?.label ??
      type
    )
  }, [])

  const isTriggerNode = useCallback((node: Node) => {
    const nodeType = node.data?.type as string | undefined
    return Boolean(
      node.type === 'trigger_node' ||
      (nodeType &&
        (TRIGGER_NODE_DEFINITIONS as Record<string, unknown>)[nodeType])
    )
  }, [])

  const validateWorkflowForDemo = useCallback(
    (nodesToValidate: Node[], edgesToValidate: Edge[]) => {
      const connectedNodeIds = new Set<string>()
      edgesToValidate.forEach((edge) => {
        if (edge.source) connectedNodeIds.add(edge.source)
        if (edge.target) connectedNodeIds.add(edge.target)
      })

      const missingActionNodes: string[] = []
      const standaloneNodes: string[] = []

      nodesToValidate.forEach((node) => {
        const label = getNodeLabel(node)
        const actionId = node.data?.actionId as string | undefined

        if (!actionId) {
          missingActionNodes.push(label)
        }

        if (!connectedNodeIds.has(node.id)) {
          standaloneNodes.push(label)
        }
      })

      const formatNodeList = (items: string[]) => {
        const unique = Array.from(new Set(items))
        if (unique.length <= 3) {
          return unique.join(', ')
        }

        return `${unique.slice(0, 3).join(', ')} (+${unique.length - 3} more)`
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
    [getNodeLabel, isTriggerNode]
  )

  const clearExecutionNodeState = useCallback(() => {
    setExecutingNodeId(null)
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isExecuting: false,
          lastStatus: undefined,
          lastOutput: undefined,
          lastExecutedAt: undefined
        }
      }))
    )
  }, [])

  const displayEdges = useMemo(() => {
    if (!executingNodeId) {
      return edges
    }

    return edges.map((edge) => {
      const isCurrentEdge = edge.source === executingNodeId

      if (!isCurrentEdge) {
        return edge
      }

      return {
        ...edge,
        className: edge.className
          ? `${edge.className} edge-flowing`
          : 'edge-flowing'
      }
    })
  }, [edges, executingNodeId])

  const appendExecutionLog = useCallback((log: Omit<ExecutionLog, 'id'>) => {
    const logEntry: ExecutionLog = {
      ...log,
      id: `${log.executionId}-${log.timestamp}-${Math.random().toString(36).slice(2, 10)}`
    }
    setExecutionLogs((currentLogs) => [...currentLogs, logEntry])
  }, [])

  const clearLogs = useCallback(() => {
    setExecutionLogs([])
    setCurrentExecution(null)
  }, [])

  const getExecutionOrder = useCallback(
    (nodesToOrder: Node[], edgesToOrder: Edge[]) => {
      const nodeMap = new Map(nodesToOrder.map((node) => [node.id, node]))
      const incomingCounts = new Map<string, number>()
      const adjacency = new Map<string, string[]>()

      nodesToOrder.forEach((node) => {
        incomingCounts.set(node.id, 0)
        adjacency.set(node.id, [])
      })

      edgesToOrder.forEach((edge) => {
        if (!edge.source || !edge.target) {
          return
        }

        if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
          return
        }

        adjacency.get(edge.source)?.push(edge.target)
        incomingCounts.set(
          edge.target,
          (incomingCounts.get(edge.target) ?? 0) + 1
        )
      })

      const queue = nodesToOrder
        .filter((node) => (incomingCounts.get(node.id) ?? 0) === 0)
        .sort((left, right) => left.position.x - right.position.x)
      const ordered: Node[] = []

      while (queue.length > 0) {
        const nextNode = queue.shift()
        if (!nextNode) {
          continue
        }

        ordered.push(nextNode)
        const neighbors = adjacency.get(nextNode.id) ?? []

        neighbors.forEach((neighborId) => {
          const remainingIncoming = (incomingCounts.get(neighborId) ?? 0) - 1
          incomingCounts.set(neighborId, remainingIncoming)

          if (remainingIncoming === 0) {
            const neighborNode = nodeMap.get(neighborId)
            if (neighborNode) {
              queue.push(neighborNode)
              queue.sort((left, right) => left.position.x - right.position.x)
            }
          }
        })
      }

      if (ordered.length === nodesToOrder.length) {
        return ordered
      }

      const seenIds = new Set(ordered.map((node) => node.id))
      return [
        ...ordered,
        ...nodesToOrder.filter((node) => !seenIds.has(node.id))
      ]
    },
    []
  )

  const onConnect = useCallback((connection: Connection) => {
    const newEdge = createEdge(connection.source!, connection.target!)
    if (connection.sourceHandle) {
      newEdge.sourceHandle = connection.sourceHandle
    }
    setEdges((currentEdges) => addEdge(newEdge, currentEdges))
  }, [])

  const addNode = useCallback(
    (nodeType: ValueOf<typeof ALL_NODE_TYPES>) => {
      const lastNode = findLastNode(nodes, edges)

      let newPosition
      if (lastNode) {
        newPosition = calculateNewNodePosition(nodes, edges, {
          fromNode: lastNode
        })
      } else {
        const viewport = reactFlowInstance.getViewport()
        const wrapperBounds = reactFlowWrapper.current?.getBoundingClientRect()

        if (wrapperBounds) {
          const centerX = (wrapperBounds.width / 2 - viewport.x) / viewport.zoom
          const centerY =
            (wrapperBounds.height / 2 - viewport.y) / viewport.zoom
          newPosition = { x: centerX - 96, y: centerY - 50 }
        } else {
          newPosition = calculateNewNodePosition(nodes, edges, {})
        }
      }

      const newNode = createNode(nodeType, newPosition)
      setNodes((currentNodes) => [...currentNodes, newNode])

      if (lastNode && lastNode.type !== 'condition_node') {
        const newEdge = createEdge(lastNode.id, newNode.id)
        setEdges((currentEdges) => addEdge(newEdge, currentEdges))
      }

      setSheetOpen(false)
    },
    [edges, nodes, reactFlowInstance]
  )

  const walkthroughSteps = useMemo<Step[]>(
    () => [
      {
        target: '[data-demo-tour-target="save-button"]',
        title: 'Step 1: Save',
        content:
          'Use Save to keep the latest workflow changes once your graph is ready.',
        placement: 'bottom'
      },
      {
        target: '[data-demo-tour-target="execute-button"]',
        title: 'Execute runs the flow',
        content:
          'Use Execute to launch a manual run after you add and connect the right nodes.',
        placement: 'bottom'
      },
      {
        target: '[data-demo-tour-target="active-toggle"]',
        title: 'Active controls availability',
        content:
          'This switch marks the workflow as active or inactive when you are ready to expose it.',
        placement: 'bottom'
      },
      {
        target: '[data-demo-tour-target="add-node-button"]',
        title: 'Add Node starts the build',
        content:
          'Open the node library here to place the first trigger or action in the editor.',
        placement: 'left'
      }
    ],
    []
  )

  const handleWalkthroughEvent = useCallback((data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setIsWalkthroughRunning(false)
    }
  }, [])

  useEffect(() => {
    if (walkthroughStartTimerRef.current !== null) {
      window.clearTimeout(walkthroughStartTimerRef.current)
      walkthroughStartTimerRef.current = null
    }

    if (!startWalkthrough) {
      setIsWalkthroughRunning(false)
      return
    }

    walkthroughStartTimerRef.current = window.setTimeout(() => {
      setIsWalkthroughRunning(true)
      walkthroughStartTimerRef.current = null
    }, 180)

    return () => {
      if (walkthroughStartTimerRef.current !== null) {
        window.clearTimeout(walkthroughStartTimerRef.current)
        walkthroughStartTimerRef.current = null
      }
    }
  }, [startWalkthrough])

  useEffect(() => {
    return () => {
      executionRunIdRef.current += 1
    }
  }, [])

  const handleSaveWorkflow = useCallback(async () => {
    const validation = validateWorkflowForDemo(nodes, edges)
    if (!validation.ok) {
      toast.error(validation.message)
      return
    }

    setIsSavingWorkflow(true)
    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 320)
      })

      initialStateRef.current = {
        nodesHash: getDemoNodesHash(nodes),
        edgesHash: getDemoEdgesHash(edges),
        name: 'Welcome Sequence',
        description: 'Demo workflow preview',
        isActive
      }

      toast.success('Demo workflow saved locally')
    } finally {
      setIsSavingWorkflow(false)
    }
  }, [edges, isActive, nodes, validateWorkflowForDemo])

  const handleExecuteWorkflow = useCallback(async () => {
    if (isExecutingWorkflow || isExecutingNode) {
      return
    }

    const validation = validateWorkflowForDemo(nodes, edges)
    if (!validation.ok) {
      toast.error(validation.message)
      return
    }

    const orderedNodes = getExecutionOrder(nodes, edges)
    const executionId = `demo-exec-${Date.now()}`
    const totalNodes = orderedNodes.length
    const workflowStartTime = Date.now()
    const runId = executionRunIdRef.current + 1
    executionRunIdRef.current = runId

    clearExecutionNodeState()
    setIsExecutingWorkflow(true)
    setCurrentExecution({
      id: executionId,
      status: 'running',
      progress: {
        current: 0,
        total: totalNodes
      }
    })

    appendExecutionLog({
      type: 'workflow:start',
      workflowId: 'demo-workflow-preview',
      executionId,
      timestamp: new Date().toISOString(),
      data: {
        status: 'running',
        progress: {
          current: 0,
          total: totalNodes
        }
      }
    })

    try {
      for (const [index, node] of orderedNodes.entries()) {
        if (executionRunIdRef.current !== runId) {
          return
        }

        const nodeLabel = getNodeLabel(node)
        const actionId = node.data?.actionId as string | undefined

        setExecutingNodeId(node.id)
        setNodes((currentNodes) =>
          currentNodes.map((currentNode) => ({
            ...currentNode,
            data: {
              ...currentNode.data,
              isExecuting: currentNode.id === node.id,
              lastStatus:
                currentNode.id === node.id
                  ? undefined
                  : currentNode.data.lastStatus
            }
          }))
        )

        appendExecutionLog({
          type: 'node:start',
          workflowId: 'demo-workflow-preview',
          executionId,
          timestamp: new Date().toISOString(),
          data: {
            nodeId: node.id,
            nodeName: nodeLabel,
            actionId,
            status: 'running',
            progress: {
              current: index,
              total: totalNodes
            }
          }
        })

        setCurrentExecution({
          id: executionId,
          status: 'running',
          progress: {
            current: index,
            total: totalNodes
          }
        })

        const output = await demoAdapter.executeNode!({
          nodeId: node.id,
          actionId,
          config: (node.data?.config as Record<string, any> | undefined) || {},
          nodeLabel
        })

        if (executionRunIdRef.current !== runId) {
          return
        }

        appendExecutionLog({
          type: 'node:complete',
          workflowId: 'demo-workflow-preview',
          executionId,
          timestamp: new Date().toISOString(),
          data: {
            nodeId: node.id,
            nodeName: nodeLabel,
            actionId,
            output,
            duration: 2000,
            status: 'completed',
            progress: {
              current: index + 1,
              total: totalNodes
            }
          }
        })

        setNodes((currentNodes) =>
          currentNodes.map((currentNode) => ({
            ...currentNode,
            data: {
              ...currentNode.data,
              isExecuting: false,
              lastStatus:
                currentNode.id === node.id
                  ? 'completed'
                  : currentNode.data.lastStatus,
              ...(currentNode.id === node.id && output !== undefined
                ? {
                    lastOutput: output,
                    lastExecutedAt: new Date().toISOString()
                  }
                : {})
            }
          }))
        )

        setCurrentExecution({
          id: executionId,
          status: 'running',
          progress: {
            current: index + 1,
            total: totalNodes
          }
        })
      }

      if (executionRunIdRef.current !== runId) {
        return
      }

      const duration = Date.now() - workflowStartTime

      setExecutingNodeId(null)
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isExecuting: false
          }
        }))
      )
      setCurrentExecution({
        id: executionId,
        status: 'completed',
        progress: {
          current: totalNodes,
          total: totalNodes
        }
      })
      appendExecutionLog({
        type: 'workflow:complete',
        workflowId: 'demo-workflow-preview',
        executionId,
        timestamp: new Date().toISOString(),
        data: {
          duration,
          status: 'completed',
          progress: {
            current: totalNodes,
            total: totalNodes
          }
        }
      })
      toast.success('Demo workflow executed with mock output')
    } finally {
      if (executionRunIdRef.current === runId) {
        setIsExecutingWorkflow(false)
      }
    }
  }, [
    appendExecutionLog,
    clearExecutionNodeState,
    demoAdapter,
    edges,
    getExecutionOrder,
    getNodeLabel,
    isExecutingNode,
    isExecutingWorkflow,
    nodes,
    validateWorkflowForDemo
  ])

  return (
    <WorkflowEditorProvider
      workflowId='demo-workflow-preview'
      workflowName='Welcome Sequence'
      workflowDescription='Demo workflow preview'
      hasUnsavedChanges={hasUnsavedChanges}
      initialStateRef={initialStateRef}
      getNodesHash={getDemoNodesHash}
      getEdgesHash={getDemoEdgesHash}
      isActive={isActive}
      isExecutingWorkflow={isExecutingWorkflow}
      isExecutingNode={isExecutingNode}
      setIsExecutingNode={setIsExecutingNode}
      isTogglingActive={isTogglingActive}
      setIsTogglingActive={setIsTogglingActive}
      demoAdapter={demoAdapter}
    >
      <section className='relative flex h-screen w-full min-h-0 flex-col overflow-hidden'>
        <Joyride
          run={isWalkthroughRunning}
          continuous
          scrollToFirstStep={false}
          steps={walkthroughSteps}
          onEvent={handleWalkthroughEvent}
          options={{
            buttons: ['back', 'close', 'primary', 'skip'],
            showProgress: true,
            skipBeacon: true,
            spotlightPadding: 12,
            closeButtonAction: 'skip',
            overlayClickAction: false,
            overlayColor: 'rgba(3, 7, 18, 0.72)',
            backgroundColor: '#ffffff',
            textColor: '#0f172a',
            primaryColor: '#53f09b',
            zIndex: 2200,
            arrowColor: '#ffffff'
          }}
          locale={{
            next: 'Next',
            nextWithProgress: 'Next ({current}/{total})',
            last: 'Done',
            skip: 'Skip',
            close: 'Close'
          }}
        />

        <WorkflowHeader
          workflowName='Welcome Sequence'
          workflowDescription='Demo workflow preview'
          onBack={onBack}
          onEdit={() => {}}
          onSave={handleSaveWorkflow}
          isSaving={isSavingWorkflow}
          workflowId='demo-workflow-preview'
          onExecute={handleExecuteWorkflow}
          isExecuting={isExecutingWorkflow}
          isActive={isActive}
          onToggleActive={setIsActive}
          isTogglingActive={isTogglingActive}
          isWorkflowEmpty={isWorkflowEmpty}
          isManualTrigger={isManualTrigger}
        />

        <Tabs
          className='relative h-full w-full min-h-0 flex-1 gap-0'
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as 'editor' | 'executions')
          }}
        >
          <TabsList className='demo-workflow-tabs-floating'>
            <TabsTrigger value='editor' className='demo-workflow-tab-trigger'>
              Editor
            </TabsTrigger>
            <TabsTrigger
              value='executions'
              className='demo-workflow-tab-trigger'
            >
              Executions
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value='editor'
            className='mt-0 w-full min-h-0 flex-1 overflow-hidden'
          >
            <div
              className='relative flex h-full min-h-0 w-full flex-col'
              ref={reactFlowWrapper}
            >
              <div className='absolute right-4 top-6 z-10'>
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      data-demo-tour-target='add-node-button'
                      variant='default'
                      size='lg'
                      className='size-10 rounded-lg'
                    >
                      <Plus className='size-5' />
                    </Button>
                  </SheetTrigger>
                  <AddNodeSheetContent
                    onOpenChange={setSheetOpen}
                    onAddNode={addNode}
                    showOnlyTriggers={isWorkflowEmpty}
                    showOnlyActions={!isWorkflowEmpty}
                  />
                </Sheet>
              </div>

              {isWorkflowEmpty && (
                <EmptyWorkflowPlaceholder
                  isAIGenerating={false}
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
                deleteKeyCode={null}
                fitView
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
              >
                <Background gap={40} />
              </ReactFlow>

              <div className='demo-workflow-welcome-mascot' aria-hidden='true'>
                <div className='demo-workflow-welcome-bubble'>
                  Welcome! Let&apos;s build your workflow.
                </div>
                <div className='demo-workflow-welcome-avatar'>
                  <div className='demo-workflow-robot'>
                    <span className='demo-workflow-robot-antenna' />
                    <span className='demo-workflow-robot-head'>
                      <span className='demo-workflow-robot-eye demo-workflow-robot-eye-left' />
                      <span className='demo-workflow-robot-eye demo-workflow-robot-eye-right' />
                      <span className='demo-workflow-robot-mouth' />
                      <span className='demo-workflow-robot-cheek demo-workflow-robot-cheek-left' />
                      <span className='demo-workflow-robot-cheek demo-workflow-robot-cheek-right' />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value='executions'
            className='mt-0 w-full min-h-0 flex-1 overflow-hidden'
          >
            <WorkflowExecutionTab
              isConnected
              executionLogs={executionLogs}
              currentExecution={currentExecution}
              clearLogs={clearLogs}
              nodeActionIdById={nodeActionIdById}
            />
          </TabsContent>
        </Tabs>
      </section>
    </WorkflowEditorProvider>
  )
}

export default function DemoPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollProgressRef = useRef(0)
  const transitionTimersRef = useRef<number[]>([])

  const [reducedMotion, setReducedMotion] = useState(false)
  const [demoStage, setDemoStage] = useState<'landing' | 'workflow'>('landing')
  const [isTvTransitionActive, setIsTvTransitionActive] = useState(false)

  const isWorkflowStage = demoStage === 'workflow'
  const tvTransitionStyle = {
    '--demo-tv-duration': `${reducedMotion ? 960 : TV_TRANSITION_TOTAL_MS}ms`
  } as CSSProperties

  const setScrollProgress = useCallback((value: number) => {
    const normalized = Math.min(Math.max(value, 0), 1)
    scrollProgressRef.current = normalized
    rootRef.current?.style.setProperty(
      '--demo-scroll-progress',
      normalized.toFixed(4)
    )
  }, [])

  const clearTransitionTimers = useCallback(() => {
    while (transitionTimersRef.current.length > 0) {
      const timer = transitionTimersRef.current.pop()

      if (timer !== undefined) {
        window.clearTimeout(timer)
      }
    }
  }, [])

  const handleStartDemo = useCallback(() => {
    if (isWorkflowStage || isTvTransitionActive) {
      return
    }

    clearTransitionTimers()
    setIsTvTransitionActive(true)

    const swapDelay = reducedMotion ? 220 : TV_TRANSITION_SWAP_DELAY_MS
    const totalDelay = reducedMotion ? 960 : TV_TRANSITION_TOTAL_MS

    const showWorkflowTimer = window.setTimeout(() => {
      setDemoStage('workflow')
    }, swapDelay)
    const clearTransitionTimer = window.setTimeout(() => {
      setIsTvTransitionActive(false)
    }, totalDelay)

    transitionTimersRef.current.push(showWorkflowTimer, clearTransitionTimer)
  }, [
    clearTransitionTimers,
    isTvTransitionActive,
    isWorkflowStage,
    reducedMotion
  ])

  useSmoothScroll({
    enabled: !isWorkflowStage,
    onScroll: ({ progress }) => {
      setScrollProgress(progress)
    }
  })

  useEffect(() => {
    return () => {
      clearTransitionTimers()
    }
  }, [clearTransitionTimers])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const updateMotionPreference = () => {
      setReducedMotion(mediaQuery.matches)
    }

    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)

    return () => {
      mediaQuery.removeEventListener('change', updateMotionPreference)
    }
  }, [])

  useEffect(() => {
    if (isWorkflowStage) {
      setScrollProgress(1)
      return
    }

    const updateNativeScrollProgress = () => {
      const scrollTop = window.scrollY || window.pageYOffset
      const limit = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      )

      setScrollProgress(scrollTop / limit)
    }

    updateNativeScrollProgress()
    window.addEventListener('scroll', updateNativeScrollProgress, {
      passive: true
    })
    window.addEventListener('resize', updateNativeScrollProgress)

    return () => {
      window.removeEventListener('scroll', updateNativeScrollProgress)
      window.removeEventListener('resize', updateNativeScrollProgress)
    }
  }, [isWorkflowStage, setScrollProgress])

  useEffect(() => {
    if (isWorkflowStage) {
      return
    }

    const root = rootRef.current

    if (!root) {
      return
    }

    const typewriterTimers: number[] = []

    const clearTypewriterTimers = () => {
      while (typewriterTimers.length > 0) {
        const timer = typewriterTimers.pop()

        if (timer !== undefined) {
          window.clearTimeout(timer)
        }
      }
    }

    const ctx = gsap.context(() => {
      const motionScale = reducedMotion ? 0.45 : 1
      const introTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
      const heroTypeTarget = root.querySelector<HTMLElement>(
        '[data-demo-hero-type]'
      )

      const runTypewriter = () => {
        if (!heroTypeTarget) {
          return
        }

        clearTypewriterTimers()

        let visibleChars = 0
        heroTypeTarget.textContent = ''
        heroTypeTarget.classList.add('is-typing')

        const typeNext = () => {
          visibleChars += 1
          heroTypeTarget.textContent = HERO_TITLE.slice(0, visibleChars)

          if (visibleChars >= HERO_TITLE.length) {
            heroTypeTarget.classList.remove('is-typing')
            return
          }

          const currentChar = HERO_TITLE[visibleChars - 1]
          const baseDelay = 24 + Math.random() * 42
          const punctuationDelay = /[.,!?;:]/.test(currentChar) ? 170 : 0
          const newlineDelay = currentChar === '\n' ? 220 : 0
          const spaceDelay = currentChar === ' ' ? 12 : 0
          const timeout = window.setTimeout(
            typeNext,
            baseDelay + punctuationDelay + newlineDelay + spaceDelay
          )
          typewriterTimers.push(timeout)
        }

        const initialTimeout = window.setTimeout(typeNext, 120)
        typewriterTimers.push(initialTimeout)
      }

      introTimeline
        .fromTo(
          '[data-demo-intro="kicker"]',
          {
            autoAlpha: 0,
            y: -18 * motionScale,
            filter: 'blur(10px)',
            letterSpacing: '0.34em'
          },
          {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            letterSpacing: '0.2em',
            duration: 0.72
          }
        )
        .fromTo(
          '[data-demo-hero-title]',
          {
            autoAlpha: 0,
            y: 24 * motionScale,
            filter: 'blur(12px)'
          },
          {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.82
          },
          '-=0.28'
        )
        .add(() => {
          runTypewriter()
        }, '-=0.04')
        .to(
          {},
          {
            duration: reducedMotion ? 0.01 : 2.7
          },
          '<'
        )
        .fromTo(
          '[data-demo-hero-line]',
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.95 },
          '-=1.95'
        )
        .fromTo(
          '[data-demo-intro="copy"]',
          {
            autoAlpha: 0,
            y: 26 * motionScale,
            x: -16 * motionScale,
            filter: 'blur(8px)'
          },
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            filter: 'blur(0px)',
            duration: 0.8
          },
          '-=1.35'
        )

      const revealElements =
        gsap.utils.toArray<HTMLElement>('[data-demo-reveal]')
      revealElements.forEach((element, index) => {
        const variant = element.dataset.demoReveal
        const trigger = {
          trigger: element,
          start: 'top 86%'
        }

        if (variant === 'heading') {
          gsap.fromTo(
            element,
            {
              autoAlpha: 0,
              y: 30 * motionScale,
              x: (index % 2 === 0 ? -20 : 20) * motionScale,
              filter: 'blur(10px)'
            },
            {
              autoAlpha: 1,
              y: 0,
              x: 0,
              filter: 'blur(0px)',
              duration: 0.88,
              ease: 'power3.out',
              scrollTrigger: trigger
            }
          )
          return
        }

        if (variant === 'strip') {
          gsap.fromTo(
            element,
            {
              autoAlpha: 0,
              y: 22 * motionScale,
              scale: 0.97
            },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.76,
              ease: 'power2.out',
              scrollTrigger: trigger
            }
          )
          return
        }

        if (variant === 'cta') {
          gsap.fromTo(
            element,
            {
              autoAlpha: 0,
              y: 34 * motionScale,
              clipPath: 'inset(0 0 100% 0)'
            },
            {
              autoAlpha: 1,
              y: 0,
              clipPath: 'inset(0 0 0% 0)',
              duration: 0.92,
              ease: 'power3.out',
              scrollTrigger: trigger
            }
          )
          return
        }

        gsap.fromTo(
          element,
          {
            autoAlpha: 0,
            y: 34 * motionScale
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: trigger
          }
        )
      })

      const cardElements = gsap.utils.toArray<HTMLElement>('[data-demo-card]')
      cardElements.forEach((element, index) => {
        gsap.fromTo(
          element,
          {
            autoAlpha: 0,
            y: (32 + (index % 3) * 8) * motionScale,
            x: (index % 2 === 0 ? -12 : 12) * motionScale,
            rotateX: (index % 3 === 0 ? 14 : 9) * motionScale,
            rotateY: (index % 2 === 0 ? -6 : 6) * motionScale,
            filter: 'blur(8px)'
          },
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            rotateX: 0,
            rotateY: 0,
            filter: 'blur(0px)',
            duration: 0.82 + (index % 3) * 0.06,
            delay: index * 0.04,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 85%'
            }
          }
        )
      })

      const parallaxElements = gsap.utils.toArray<HTMLElement>(
        '[data-demo-parallax]'
      )

      parallaxElements.forEach((element, index) => {
        const baseDistance = index % 2 === 0 ? -24 : 24
        const distance = baseDistance * motionScale

        gsap.to(element, {
          y: distance,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        })
      })
    }, root)

    return () => {
      clearTypewriterTimers()
      ctx.revert()
    }
  }, [isWorkflowStage, reducedMotion])

  return (
    <div
      ref={rootRef}
      className={`demo-page ${isWorkflowStage ? 'demo-page-workflow' : ''}`}
      style={isWorkflowStage ? undefined : { backgroundColor: DEMO_BACKGROUND }}
    >
      {!isWorkflowStage ? (
        <>
          <div className='demo-background' aria-hidden='true'>
            <MarsColonyScene
              progressRef={scrollProgressRef}
              reducedMotion={reducedMotion}
              onStartDemo={handleStartDemo}
            />
            <div className='demo-vignette' />
          </div>

          <aside className='demo-scroll-indicator' aria-hidden='true'>
            <div className='demo-scroll-track'>
              <div className='demo-scroll-dot' data-demo-scroll-dot />
            </div>
          </aside>

          <main className='demo-content'>
            <section className='demo-section demo-hero' data-demo-section>
              <p className='demo-kicker' data-demo-intro='kicker'>
                LIVE WORKFLOW CONTROL
              </p>

              <h1
                className='demo-hero-title'
                data-demo-hero-title
                data-demo-parallax
                aria-label='Complexity is inevitable. Friction is optional.'
              >
                <span className='demo-hero-type' data-demo-hero-type />
              </h1>

              <div className='demo-hero-line' data-demo-hero-line />

              <p
                className='demo-hero-copy'
                data-demo-intro='copy'
                data-demo-parallax
              >
                Orchestrate, monitor, and adapt critical pipelines in one
                runtime surface built for speed.
              </p>
            </section>

            <section
              id='capabilities'
              className='demo-section demo-section-large'
              data-demo-section
            >
              <div className='demo-section-heading' data-demo-reveal='heading'>
                <p className='demo-kicker'>CAPABILITIES</p>
                <h2 data-demo-parallax>
                  Purpose-built for high-context workflow systems
                </h2>
              </div>

              <div className='demo-card-grid'>
                {capabilityCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <article
                      key={card.title}
                      className='demo-card'
                      data-demo-card
                    >
                      <div className='demo-icon-badge'>
                        <Icon className='size-5 text-primary' />
                      </div>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                    </article>
                  )
                })}
              </div>
            </section>

            <section
              id='workflow'
              className='demo-section demo-section-large'
              data-demo-section
            >
              <div className='demo-section-heading' data-demo-reveal='heading'>
                <p className='demo-kicker'>EXECUTION BLUEPRINT</p>
                <h2 data-demo-parallax>
                  From intent to autonomous operation in four loops
                </h2>
              </div>

              <div className='demo-workflow-grid'>
                {workflowSteps.map((step, index) => (
                  <article
                    key={step.title}
                    className='demo-workflow-item'
                    data-demo-card
                  >
                    <div className='demo-workflow-index'>0{index + 1}</div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                ))}
              </div>

              <div className='demo-feature-strip' data-demo-reveal='strip'>
                <div>
                  <CircuitBoard className='size-5 text-primary' />
                  <p>Constraint-aware orchestration graph</p>
                </div>
                <div>
                  <Network className='size-5 text-primary' />
                  <p>Cross-team dependency visibility</p>
                </div>
                <div>
                  <Bot className='size-5 text-primary' />
                  <p>AI-assisted remediation routing</p>
                </div>
              </div>
            </section>

            <section
              id='results'
              className='demo-section demo-section-large'
              data-demo-section
            >
              <div className='demo-section-heading' data-demo-reveal='heading'>
                <p className='demo-kicker'>OPERATIONAL IMPACT</p>
                <h2 data-demo-parallax>
                  Numbers that hold under production pressure
                </h2>
              </div>

              <div className='demo-metric-grid'>
                {metrics.map((metric) => (
                  <article
                    key={metric.label}
                    className='demo-metric'
                    data-demo-card
                  >
                    <h3>{metric.value}</h3>
                    <p>{metric.label}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className='demo-finale-space' aria-hidden='true' />
          </main>
        </>
      ) : (
        <DemoWorkflowShowcase
          onBack={() => setDemoStage('landing')}
          startWalkthrough={!isTvTransitionActive}
        />
      )}

      <div
        className={`demo-tv-transition ${isTvTransitionActive ? 'is-active' : ''} ${reducedMotion ? 'is-reduced-motion' : ''}`}
        aria-hidden='true'
        style={tvTransitionStyle}
      >
        <div className='demo-tv-shutter demo-tv-shutter-top' />
        <div className='demo-tv-shutter demo-tv-shutter-bottom' />
        <div className='demo-tv-scanline' />
        <div className='demo-tv-glow' />
      </div>
    </div>
  )
}
