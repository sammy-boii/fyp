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

type WorkflowEditorContextValue = {
  saveIfChanged: () => Promise<void>
  isSaving: boolean
  isExecutingWorkflow: boolean
  isExecutingNode: boolean
  isAnyOperationPending: boolean
  setIsExecutingNode: (value: boolean) => void
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
  initialStateRef: React.MutableRefObject<{
    nodesHash: string
    edgesHash: string
    name: string
    description: string
  } | null>
  getNodesHash: (nodes: Node[]) => string
  getEdgesHash: (edges: Edge[]) => string
  isExecutingWorkflow: boolean
  isExecutingNode: boolean
  setIsExecutingNode: (value: boolean) => void
}

export function WorkflowEditorProvider({
  children,
  workflowId,
  workflowName,
  workflowDescription,
  initialStateRef,
  getNodesHash,
  getEdgesHash,
  isExecutingWorkflow,
  isExecutingNode,
  setIsExecutingNode
}: WorkflowEditorProviderProps) {
  const { getNodes, getEdges } = useReactFlow()
  const updateWorkflow = useUpdateWorkflow()
  const isSavingRef = useRef(false)

  const isSaving = updateWorkflow.isPending
  const isAnyOperationPending =
    isSaving || isExecutingWorkflow || isExecutingNode

  const saveIfChanged = useCallback(async () => {
    if (isSavingRef.current || isExecutingWorkflow) return

    const nodes = getNodes()
    const edges = getEdges()

    const currentNodesHash = getNodesHash(nodes)
    const currentEdgesHash = getEdgesHash(edges)
    const hasChanges =
      !initialStateRef.current ||
      currentNodesHash !== initialStateRef.current.nodesHash ||
      currentEdgesHash !== initialStateRef.current.edgesHash ||
      workflowName !== initialStateRef.current.name ||
      workflowDescription !== initialStateRef.current.description

    if (hasChanges) {
      isSavingRef.current = true
      try {
        await updateWorkflow.mutateAsync({
          id: workflowId,
          data: {
            name: workflowName,
            description: workflowDescription,
            nodes: nodes as unknown as any[],
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
    initialStateRef,
    updateWorkflow,
    isExecutingWorkflow
  ])

  return (
    <WorkflowEditorContext.Provider
      value={{
        saveIfChanged,
        isSaving,
        isExecutingWorkflow,
        isExecutingNode,
        isAnyOperationPending,
        setIsExecutingNode
      }}
    >
      {children}
    </WorkflowEditorContext.Provider>
  )
}
