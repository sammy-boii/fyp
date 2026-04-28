'use client'

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  ReactNode
} from 'react'
import { Node, Edge, useReactFlow } from '@xyflow/react'
import { useUpdateWorkflow } from '@/hooks/use-workflows'

export type DemoCredentialOption = {
  id: string
  provider: string
  service: string
}

export type DemoGuild = {
  id: string
  name: string
  icon: string | null
  owner: boolean
}

export type DemoChannel = {
  id: string
  name: string
  type: string
  typeId: number
  position: number
  parentId: string | null
  topic: string | null
}

export type DemoGuildMember = {
  id: string
  username: string
  displayName: string
  avatar: string | null
  isBot: boolean
}

export type DemoDriveItem = {
  id: string
  name: string
  mimeType: string
  iconLink: string
  isFolder: boolean
}

export type DemoWorkflowAdapter = {
  isDemo: true
  credentials: DemoCredentialOption[]
  listGuilds: (credentialId: string) => Promise<DemoGuild[]> | DemoGuild[]
  listChannels: (
    credentialId: string,
    guildId: string,
    type?: 'all' | 'text' | 'voice' | 'category' | 'announcement' | 'forum'
  ) => Promise<DemoChannel[]> | DemoChannel[]
  listGuildMembers: (
    credentialId: string,
    guildId: string
  ) => Promise<DemoGuildMember[]> | DemoGuildMember[]
  listDriveItems: (
    credentialId: string,
    type?: 'all' | 'files' | 'folders',
    folderId?: string
  ) => Promise<DemoDriveItem[]> | DemoDriveItem[]
  executeNode?: (input: {
    nodeId: string
    actionId?: string
    config?: Record<string, any>
    nodeLabel?: string
  }) => Promise<Record<string, any> | undefined>
}

type WorkflowEditorContextValue = {
  saveIfChanged: () => Promise<void>
  hasUnsavedChanges: boolean
  isSaving: boolean
  isExecutingWorkflow: boolean
  isExecutingNode: boolean
  isTogglingActive: boolean
  isAnyOperationPending: boolean
  setIsExecutingNode: (value: boolean) => void
  setIsTogglingActive: (value: boolean) => void
  demoAdapter: DemoWorkflowAdapter | null
}

const WorkflowEditorContext = createContext<WorkflowEditorContextValue | null>(
  null
)

export function useWorkflowEditor() {
  const context = useContext(WorkflowEditorContext)
  if (!context) {
    throw new Error(
      'useWorkflowEditor must be used within a WorkflowEditorProvider'
    )
  }
  return context
}

type WorkflowEditorProviderProps = {
  children: ReactNode
  workflowId: string
  workflowName: string
  workflowDescription: string
  hasUnsavedChanges: boolean
  initialStateRef: React.MutableRefObject<{
    nodesHash: string
    edgesHash: string
    name: string
    description: string
    isActive: boolean
  } | null>
  getNodesHash: (nodes: Node[]) => string
  getEdgesHash: (edges: Edge[]) => string
  isActive: boolean
  isExecutingWorkflow: boolean
  isExecutingNode: boolean
  setIsExecutingNode: (value: boolean) => void
  isTogglingActive: boolean
  setIsTogglingActive: (value: boolean) => void
  demoAdapter?: DemoWorkflowAdapter | null
}

export function WorkflowEditorProvider({
  children,
  workflowId,
  workflowName,
  workflowDescription,
  hasUnsavedChanges,
  initialStateRef,
  getNodesHash,
  getEdgesHash,
  isActive,
  isExecutingWorkflow,
  isExecutingNode,
  setIsExecutingNode,
  isTogglingActive,
  setIsTogglingActive,
  demoAdapter = null
}: WorkflowEditorProviderProps) {
  const { getNodes, getEdges, setNodes } = useReactFlow()
  const updateWorkflow = useUpdateWorkflow()
  const isSavingRef = useRef(false)

  const isSaving = updateWorkflow.isPending
  const isAnyOperationPending =
    isSaving || isExecutingWorkflow || isExecutingNode || isTogglingActive

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

  const saveIfChanged = useCallback(async () => {
    if (demoAdapter) {
      return
    }

    if (isSavingRef.current || isExecutingWorkflow) return

    const nodes = getNodes()
    const edges = getEdges()
    const { sanitized, didChange } = stripTransientNodeState(nodes)

    if (didChange) {
      setNodes(sanitized)
    }

    const currentNodesHash = getNodesHash(sanitized)
    const currentEdgesHash = getEdgesHash(edges)
    const hasChanges =
      !initialStateRef.current ||
      currentNodesHash !== initialStateRef.current.nodesHash ||
      currentEdgesHash !== initialStateRef.current.edgesHash ||
      workflowName !== initialStateRef.current.name ||
      workflowDescription !== initialStateRef.current.description ||
      isActive !== initialStateRef.current.isActive

    if (hasChanges) {
      isSavingRef.current = true
      try {
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
        // Update initial state after save
        initialStateRef.current = {
          nodesHash: currentNodesHash,
          edgesHash: currentEdgesHash,
          name: workflowName,
          description: workflowDescription,
          isActive
        }
      } finally {
        isSavingRef.current = false
      }
    }
  }, [
    workflowId,
    workflowName,
    workflowDescription,
    getNodes,
    getEdges,
    getNodesHash,
    getEdgesHash,
    isActive,
    initialStateRef,
    updateWorkflow,
    isExecutingWorkflow,
    stripTransientNodeState,
    setNodes,
    demoAdapter
  ])

  return (
    <WorkflowEditorContext.Provider
      value={{
        saveIfChanged,
        hasUnsavedChanges,
        isSaving,
        isExecutingWorkflow,
        isExecutingNode,
        isTogglingActive,
        isAnyOperationPending,
        setIsExecutingNode,
        setIsTogglingActive,
        demoAdapter
      }}
    >
      {children}
    </WorkflowEditorContext.Provider>
  )
}
