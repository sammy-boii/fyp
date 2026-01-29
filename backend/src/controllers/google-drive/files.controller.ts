import { API_ROUTES } from '@/src/constants'
import { getValidGoogleDriveAccessTokenByCredentialId } from '@/src/lib/credentials'
import { tryCatch } from '@/src/lib/utils'
import { AppError } from '@/src/types'
import { prisma } from '@shared/db/prisma'

/**
 * List files and folders from Google Drive for a credential
 * Used for dropdowns in the frontend
 */
export const listDriveItems = tryCatch(async (c) => {
  const user = c.get('user')
  const credentialId = c.req.query('credentialId')
  const type = c.req.query('type') || 'all' // 'all', 'files', 'folders'
  const folderId = c.req.query('folderId') || '' // optional parent folder

  if (!credentialId) {
    throw new AppError('Credential ID is required', 400)
  }

  // Verify the credential belongs to the user
  const credential = await prisma.oAuthCredential.findFirst({
    where: {
      id: credentialId,
      userId: user.id,
      service: 'google-drive'
    }
  })

  if (!credential) {
    throw new AppError('Google Drive credential not found', 404)
  }

  // Get valid access token
  const { token } =
    await getValidGoogleDriveAccessTokenByCredentialId(credentialId)

  // Build query parameters
  const params = new URLSearchParams()
  params.set('pageSize', '100')
  params.set('fields', 'files(id,name,mimeType,iconLink)')
  params.set('orderBy', 'folder,name')

  // Build query string for filtering
  const queryParts: string[] = []

  // Filter by folder
  if (folderId) {
    queryParts.push(`'${folderId}' in parents`)
  }

  // Filter by type
  if (type === 'folders') {
    queryParts.push("mimeType = 'application/vnd.google-apps.folder'")
  } else if (type === 'files') {
    queryParts.push("mimeType != 'application/vnd.google-apps.folder'")
  }

  // Exclude trashed files
  queryParts.push('trashed = false')

  if (queryParts.length > 0) {
    params.set('q', queryParts.join(' and '))
  }

  const listUrl = `${API_ROUTES.GOOGLE_DRIVE.LIST_FILES}?${params.toString()}`

  // Fetch file list
  const response = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!response.ok) {
    const err = await response.json()
    console.error('[listDriveItems] Drive API Error:', err)
    throw new AppError(err?.error?.message || 'Failed to list files', 500)
  }

  const result = await response.json()

  // Filter out dot files and dot folders (files starting with '.')
  const items = (result.files || [])
    .filter((file: any) => !file.name.startsWith('.'))
    .map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      iconLink: file.iconLink,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder'
    }))

  return c.json({
    success: true,
    data: items
  })
})
