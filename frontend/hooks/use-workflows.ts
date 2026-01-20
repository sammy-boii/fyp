import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeNode
} from '@/actions/workflow.actions'
import { toast } from 'sonner'
import { Workflow } from '@shared/prisma/generated/prisma/client'

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
    mutationFn: createWorkflow,
    onSuccess: (data) => {
      if (data.error) {
        throw data.error
      }
      queryClient.invalidateQueries({
        queryKey: ['workflows']
      })

      toast.success('Workflow created successfully')
    },
    onError: (err) => {
      toast.error(err.message)
    }
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Workflow> }) =>
      updateWorkflow(id, data),
    onSuccess: (data, variables) => {
      if (data.error) {
        throw data.error
      }
      queryClient.invalidateQueries({
        queryKey: ['workflows']
      })
      toast.success('Workflow updated successfully')
      queryClient.invalidateQueries({
        queryKey: ['workflow', variables.id]
      })
    },
    onError: (err) => {
      toast.error(err.message)
    }
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: (data) => {
      if (data.error) {
        throw data.error
      }
      queryClient.invalidateQueries({
        queryKey: ['workflows']
      })
      toast.success('Workflow deleted successfully')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete workflow')
    }
  })
}

export function useExecuteNode() {
  return useMutation({
    mutationFn: ({
      workflowId,
      nodeId
    }: {
      workflowId: string
      nodeId: string
    }) => executeNode(workflowId, nodeId),
    onSuccess: (data) => {
      if (data.error) {
        throw data.error
      }
      toast.success('Node executed successfully')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to execute node')
    }
  })
}
