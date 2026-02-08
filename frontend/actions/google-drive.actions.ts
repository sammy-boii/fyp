'use server'

import { BACKEND_BASE_URL } from '@/constants'
import { getCurrentUser } from '@/data/dal'
import { tryCatch } from '@/lib/utils'
import { cookies } from 'next/headers'

export type DriveItem = {
  id: string
  name: string
  mimeType: string
  iconLink: string
  isFolder: boolean
}

export async function listDriveItems(
  credentialId: string,
  type: 'all' | 'files' | 'folders' = 'all',
  folderId?: string
) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      throw new Error('Not authenticated')
    }

    const params = new URLSearchParams()
    params.set('credentialId', credentialId)
    params.set('type', type)
    if (folderId) {
      params.set('folderId', folderId)
    }

    const response = await fetch(
      `${BACKEND_BASE_URL}/api/google-drive/files?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to fetch drive items')
    }

    const data = await response.json()
    return data.data as DriveItem[]
  })
}
