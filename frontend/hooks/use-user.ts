import { getProfile } from '@/actions/user.actions'
import { useQuery } from '@tanstack/react-query'

export function useGetProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile
  })
}
