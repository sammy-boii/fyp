import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCredentials,
  updateCredentials,
  deleteCredential
} from '@/actions/credentials.actions'

export function useUpdateCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string | null }) =>
      updateCredentials(id, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ['credentials', id]
      })
      queryClient.invalidateQueries({
        queryKey: ['credentials']
      })
    }
  })
}

export function useDeleteCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCredential(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['credentials']
      })
    }
  })
}

export function useGetCredentials() {
  return useQuery({
    queryKey: ['credentials'],
    queryFn: getCredentials
  })
}
