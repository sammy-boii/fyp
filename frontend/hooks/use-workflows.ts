import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow
} from '@/actions/workflow.actions'
import { Node, Edge } from '@xyflow/react'

export type WorkflowData = {
  name?: string
  description?: string
  status?: 'active' | 'inactive' | 'paused'
  nodes: Node[]
  edges: Edge[]
}

export function useGetWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: getWorkflows
  })
}

export function useGetWorkflow(id: string | null) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => (id ? getWorkflow(id) : null),
    enabled: !!id
  })
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      description?: string
      status?: 'active' | 'inactive' | 'paused'
      nodes: Node[]
      edges: Edge[]
    }) => createWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workflows']
      })
    }
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkflowData> }) =>
      updateWorkflow(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workflows']
      })
      queryClient.invalidateQueries({
        queryKey: ['workflow', variables.id]
      })
    }
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workflows']
      })
    }
  })
}
