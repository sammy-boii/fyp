import { API_ROUTES } from '../constants'
import { getValidGoogleDriveAccessTokenByCredentialId } from '../lib/credentials'
import { TNodeExecutionResult } from '../types/workflow.types'

/**
 * Create a folder in Google Drive
 */
export const executeCreateFolder = async (
  config: any
): Promise<TNodeExecutionResult> => {
  try {
    const { name, parentFolderId, credentialId } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    if (!name) {
      return { success: false, error: 'Folder name is required' }
    }

    // Get valid Google Drive access token
    const { token } =
      await getValidGoogleDriveAccessTokenByCredentialId(credentialId)

    // Build folder metadata
    const folderMetadata: Record<string, any> = {
      name,
      mimeType: 'application/vnd.google-apps.folder'
    }

    // Add parent folder if specified
    if (parentFolderId) {
      folderMetadata.parents = [parentFolderId]
    }

    // Create folder via Drive API
    const response = await fetch(API_ROUTES.GOOGLE_DRIVE.CREATE_FILE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderMetadata)
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('[executeCreateFolder] Drive API Error:', err)
      return {
        success: false,
        error: err?.error?.message || 'Failed to create folder'
      }
    }

    const result = await response.json()

    return {
      success: true,
      data: {
        folderId: result.id,
        name: result.name,
        webViewLink: result.webViewLink,
        message: 'Folder created successfully'
      }
    }
  } catch (error: any) {
    console.error('[executeCreateFolder] Exception:', error)
    return { success: false, error: error.message || 'Failed to create folder' }
  }
}

/**
 * Create a file in Google Drive
 */
export const executeCreateFile = async (
  config: any
): Promise<TNodeExecutionResult> => {
  try {
    const {
      name,
      content = '',
      mimeType = 'text/plain',
      parentFolderId,
      credentialId
    } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    if (!name) {
      return { success: false, error: 'File name is required' }
    }

    // Get valid Google Drive access token
    const { token } =
      await getValidGoogleDriveAccessTokenByCredentialId(credentialId)

    // Build file metadata
    const fileMetadata: Record<string, any> = {
      name,
      mimeType
    }

    // Add parent folder if specified
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId]
    }

    // For Google Docs types, use metadata-only creation then update content
    // For regular files, use multipart upload
    const isGoogleDocsType = mimeType.startsWith('application/vnd.google-apps.')

    if (isGoogleDocsType) {
      // Create Google Docs file (metadata only)
      const createResponse = await fetch(API_ROUTES.GOOGLE_DRIVE.CREATE_FILE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fileMetadata)
      })

      if (!createResponse.ok) {
        const err = await createResponse.json()
        console.error('[executeCreateFile] Drive API Error:', err)
        return {
          success: false,
          error: err?.error?.message || 'Failed to create file'
        }
      }

      const result = await createResponse.json()

      return {
        success: true,
        data: {
          fileId: result.id,
          name: result.name,
          mimeType: result.mimeType,
          webViewLink: result.webViewLink,
          message: 'File created successfully'
        }
      }
    } else {
      // Use multipart upload for regular files with content
      const boundary = '-------314159265358979323846'
      const delimiter = '\r\n--' + boundary + '\r\n'
      const closeDelimiter = '\r\n--' + boundary + '--'

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(fileMetadata) +
        delimiter +
        'Content-Type: ' +
        mimeType +
        '\r\n\r\n' +
        content +
        closeDelimiter

      const uploadUrl =
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'

      const createResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/related; boundary=' + boundary
        },
        body: multipartBody
      })

      if (!createResponse.ok) {
        const err = await createResponse.json()
        console.error('[executeCreateFile] Drive API Error:', err)
        return {
          success: false,
          error: err?.error?.message || 'Failed to create file'
        }
      }

      const result = await createResponse.json()

      return {
        success: true,
        data: {
          fileId: result.id,
          name: result.name,
          mimeType: result.mimeType,
          webViewLink: result.webViewLink,
          message: 'File created successfully'
        }
      }
    }
  } catch (error: any) {
    console.error('[executeCreateFile] Exception:', error)
    return { success: false, error: error.message || 'Failed to create file' }
  }
}

/**
 * Delete a folder from Google Drive
 */
export const executeDeleteFolder = async (
  config: any
): Promise<TNodeExecutionResult> => {
  try {
    const { folderId, credentialId } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    if (!folderId) {
      return { success: false, error: 'Folder ID is required' }
    }

    // Get valid Google Drive access token
    const { token } =
      await getValidGoogleDriveAccessTokenByCredentialId(credentialId)

    // Delete folder via Drive API
    const response = await fetch(
      API_ROUTES.GOOGLE_DRIVE.DELETE_FILE(folderId),
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      const err = await response.json()
      console.error('[executeDeleteFolder] Drive API Error:', err)
      return {
        success: false,
        error: err?.error?.message || 'Failed to delete folder'
      }
    }

    return {
      success: true,
      data: {
        folderId,
        message: 'Folder deleted successfully'
      }
    }
  } catch (error: any) {
    console.error('[executeDeleteFolder] Exception:', error)
    return { success: false, error: error.message || 'Failed to delete folder' }
  }
}

/**
 * List files from Google Drive
 */
export const executeListFiles = async (
  config: any
): Promise<TNodeExecutionResult> => {
  try {
    const { folderId, maxResults = 50, fileType = 'all', credentialId } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    // Get valid Google Drive access token
    const { token } =
      await getValidGoogleDriveAccessTokenByCredentialId(credentialId)

    // Build query parameters
    const params = new URLSearchParams()
    params.set('pageSize', String(maxResults))
    params.set(
      'fields',
      'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,iconLink)'
    )

    // Build query string for filtering
    const queryParts: string[] = []

    // Filter by folder
    if (folderId) {
      queryParts.push(`'${folderId}' in parents`)
    }

    // Filter by file type
    const mimeTypeFilters: Record<string, string> = {
      folder: "mimeType = 'application/vnd.google-apps.folder'",
      document: "mimeType = 'application/vnd.google-apps.document'",
      spreadsheet: "mimeType = 'application/vnd.google-apps.spreadsheet'",
      pdf: "mimeType = 'application/pdf'",
      image:
        "(mimeType = 'image/jpeg' or mimeType = 'image/png' or mimeType = 'image/gif' or mimeType = 'image/webp' or mimeType = 'image/svg+xml' or mimeType = 'image/bmp')"
    }

    if (fileType !== 'all' && mimeTypeFilters[fileType]) {
      queryParts.push(mimeTypeFilters[fileType])
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
      console.error('[executeListFiles] Drive API Error:', err)
      return {
        success: false,
        error: err?.error?.message || 'Failed to list files'
      }
    }

    const result = await response.json()

    const files = (result.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? parseInt(file.size) : null,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      iconLink: file.iconLink
    }))

    return {
      success: true,
      data: {
        files,
        count: files.length,
        folderId: folderId || 'root',
        fileType
      }
    }
  } catch (error: any) {
    console.error('[executeListFiles] Exception:', error)
    return { success: false, error: error.message || 'Failed to list files' }
  }
}

/**
 * Delete a file from Google Drive
 */
export const executeDeleteFile = async (
  config: any
): Promise<TNodeExecutionResult> => {
  try {
    const { fileId, credentialId } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    if (!fileId) {
      return { success: false, error: 'File ID is required' }
    }

    // Get valid Google Drive access token
    const { token } =
      await getValidGoogleDriveAccessTokenByCredentialId(credentialId)

    // Delete file via Drive API
    const response = await fetch(API_ROUTES.GOOGLE_DRIVE.DELETE_FILE(fileId), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('[executeDeleteFile] Drive API Error:', err)
      return {
        success: false,
        error: err?.error?.message || 'Failed to delete file'
      }
    }

    return {
      success: true,
      data: {
        fileId,
        message: 'File deleted successfully'
      }
    }
  } catch (error: any) {
    console.error('[executeDeleteFile] Exception:', error)
    return { success: false, error: error.message || 'Failed to delete file' }
  }
}

/**
 * Get file content from Google Drive
 * Supports: text files, Google Docs, Google Sheets, PDFs
 */
export const executeGetFileContent = async (
  config: any
): Promise<TNodeExecutionResult> => {
  try {
    const { fileId, credentialId } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    if (!fileId) {
      return { success: false, error: 'File ID is required' }
    }

    // Get valid Google Drive access token
    const { token } =
      await getValidGoogleDriveAccessTokenByCredentialId(credentialId)

    // First, get file metadata to determine the type
    const metadataUrl = `${API_ROUTES.GOOGLE_DRIVE.GET_FILE(fileId)}?fields=id,name,mimeType,size`
    const metadataResponse = await fetch(metadataUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!metadataResponse.ok) {
      const err = await metadataResponse.json()
      console.error('[executeGetFileContent] Metadata Error:', err)
      return {
        success: false,
        error: err?.error?.message || 'Failed to get file metadata'
      }
    }

    const metadata = await metadataResponse.json()
    const { mimeType, name } = metadata

    let content: string = ''

    // Handle different file types
    if (mimeType === 'application/vnd.google-apps.document') {
      // Google Docs - export as plain text
      const exportUrl = API_ROUTES.GOOGLE_DRIVE.EXPORT_FILE(
        fileId,
        'text/plain'
      )
      const response = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const err = await response.json()
        return {
          success: false,
          error: err?.error?.message || 'Failed to export Google Doc'
        }
      }
      content = await response.text()
    } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      // Google Sheets - export as CSV
      const exportUrl = API_ROUTES.GOOGLE_DRIVE.EXPORT_FILE(fileId, 'text/csv')
      const response = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const err = await response.json()
        return {
          success: false,
          error: err?.error?.message || 'Failed to export Google Sheet'
        }
      }
      content = await response.text()
    } else if (mimeType === 'application/pdf') {
      // PDF - download and parse using pdfjs-dist
      const downloadUrl = API_ROUTES.GOOGLE_DRIVE.GET_FILE_CONTENT(fileId)
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const err = await response.json()
        return {
          success: false,
          error: err?.error?.message || 'Failed to download PDF'
        }
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      try {
        // Dynamic import to avoid ESM issues
        const pdfParse = (await import('pdf-parse-fork')).default
        const pdfData = await pdfParse(buffer)
        content = pdfData.text
      } catch (pdfError: any) {
        console.error('[executeGetFileContent] PDF parse error:', pdfError)
        return {
          success: false,
          error: 'Failed to parse PDF content: ' + pdfError.message
        }
      }
    } else if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/xml' ||
      mimeType === 'application/javascript'
    ) {
      // Text-based files - download directly
      const downloadUrl = API_ROUTES.GOOGLE_DRIVE.GET_FILE_CONTENT(fileId)
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const err = await response.json()
        return {
          success: false,
          error: err?.error?.message || 'Failed to download file'
        }
      }
      content = await response.text()
    } else {
      // Unsupported file type
      return {
        success: false,
        error: `Unsupported file type: ${mimeType}. Supported types: text files, Google Docs, Google Sheets, PDFs`
      }
    }

    return {
      success: true,
      data: {
        fileId,
        name,
        mimeType,
        content,
        contentLength: content.length
      }
    }
  } catch (error: any) {
    console.error('[executeGetFileContent] Exception:', error)
    return {
      success: false,
      error: error.message || 'Failed to get file content'
    }
  }
}
