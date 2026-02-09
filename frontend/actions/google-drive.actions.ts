'use server'

import { getCurrentUser } from '@/data/dal'
import { api } from '@/lib/api'
import { tryCatch } from '@/lib/utils'

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

    const params = new URLSearchParams()
    params.set('credentialId', credentialId)
    params.set('type', type)
    if (folderId) {
      params.set('folderId', folderId)
    }

    const data = await api
      .get('api/google-drive/files', { searchParams: params })
      .json<{ data: DriveItem[] }>()

    return data.data
  })
}
