import {
  getDashboardStats,
  getProfile,
  updateProfile
} from '@/actions/user.actions'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useGetProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })
}

export function useGetDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
