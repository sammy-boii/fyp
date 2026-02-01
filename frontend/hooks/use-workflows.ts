import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeNode,
  executeWorkflow
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
    onMutate: async () => {
      const toastId = toast.loading('Updating workflow...')
      return toastId
    },
    onSuccess: (data, variables, toastId) => {
      if (data.error) {
        toast.dismiss(toastId as string)
        throw data.error
      }
      queryClient.invalidateQueries({
        queryKey: ['workflows']
      })
      toast.dismiss(toastId as string)
      toast.success('Workflow saved successfully')
      queryClient.invalidateQueries({
        queryKey: ['workflow', variables.id]
      })
    },
    onError: (err, _variables, toastId) => {
      toast.dismiss(toastId as string)
      toast.error(err.message || 'Failed to save workflow')
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

export function useExecuteWorkflow() {
  return useMutation({
    mutationFn: (workflowId: string) => executeWorkflow(workflowId),
    onMutate: async () => {
      const toastId = toast.loading('Executing workflow...')
      return toastId
    },
    onSuccess: (data, variables, toastId) => {
      if (data.error) {
        toast.dismiss(toastId as string)
        throw data.error
      }
      const duration = ((data.data.data?.duration ?? 0) / 1000).toFixed(2)
      toast.dismiss(toastId as string)
      toast.success(`Workflow executed successfully in ${duration}s`)
    },
    onError: (err, variables, toastId) => {
      toast.dismiss(toastId as string)
      toast.error(err.message || 'Failed to execute workflow')
    }
  })
}

export function useExecuteNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workflowId,
      nodeId
    }: {
      workflowId: string
      nodeId: string
    }) => executeNode(workflowId, nodeId),
    onMutate: async () => {
      const toastId = toast.loading('Executing node...')
      return toastId
    },
    onSuccess: (data, variables, toastId) => {
      toast.dismiss(toastId as string)
      if (data.data?.error) {
        toast.error('Node execution failed: ' + data.data.error || '')
        return data
      }
      toast.success('Node executed successfully')
      queryClient.invalidateQueries({
        queryKey: ['workflow', variables.workflowId]
      })
      return data
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to execute node')
    }
  })
}
