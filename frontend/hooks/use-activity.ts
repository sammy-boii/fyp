'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  clearUserExecutionActivity,
  getExecutionDetails,
  getUserExecutionActivity
} from '@/actions/user.actions'
import { toast } from 'sonner'

export function useGetUserExecutionActivity() {
  return useQuery({
    queryKey: ['activity-executions'],
    queryFn: getUserExecutionActivity
  })
}

export function useGetExecutionDetails(executionId: string | null) {
  return useQuery({
    queryKey: ['activity-execution', executionId],
    queryFn: () => getExecutionDetails(executionId as string),
    enabled: Boolean(executionId)
  })
}

export function useClearUserExecutionActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clearUserExecutionActivity,
    onMutate: async () => {
      const toastId = toast.loading('Clearing execution history...')
      return toastId
    },
    onSuccess: (data, _variables, toastId) => {
      toast.dismiss(toastId as string)
      if (data.error) {
        throw data.error
      }
      queryClient.invalidateQueries({
        queryKey: ['activity-executions']
      })
      toast.success('Execution history cleared')
    },
    onError: (err, _variables, toastId) => {
      toast.dismiss(toastId as string)
      toast.error(err.message || 'Failed to clear history')
    }
  })
}
