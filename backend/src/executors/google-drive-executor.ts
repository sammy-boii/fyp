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
    return { success: false, error: error.message || 'Failed to create folder' }
  }
}

/**
 * Create a file in Google Drive
 * Supports: text files, HTML, CSV, images (base64), and PDFs (text to PDF)
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

    const boundary = '-------314159265358979323846'
    const delimiter = '\r\n--' + boundary + '\r\n'
    const closeDelimiter = '\r\n--' + boundary + '--'

    let multipartBody: string

    // Handle different file types
    if (mimeType.startsWith('image/')) {
      // Image files - content is base64 data
      if (!content) {
        return { success: false, error: 'Image data (base64) is required' }
      }

      // Handle both raw base64 and data URL format
      let base64Data = content
      if (content.includes(',')) {
        base64Data = content.split(',')[1]
      }

      const metadataPart =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(fileMetadata)

      const mediaPart =
        delimiter +
        'Content-Type: ' +
        mimeType +
        '\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Data

      multipartBody = metadataPart + mediaPart + closeDelimiter
    } else if (mimeType === 'application/pdf') {
      // PDF files - check if content is base64 (binary upload) or plain text (generate PDF)
      if (!content) {
        return { success: false, error: 'PDF content is required' }
      }

      let base64Data: string

      // Check if content looks like base64 (from Get File Content binary mode)
      const isBase64 =
        content.startsWith('data:application/pdf;base64,') ||
        /^[A-Za-z0-9+/=]+$/.test(content.replace(/\s/g, '').slice(0, 100))

      if (content.startsWith('data:application/pdf;base64,')) {
        // Data URL format - extract base64 part
        base64Data = content.split(',')[1]
      } else if (isBase64 && content.length > 500 && !content.includes(' ')) {
        // Raw base64 data (no spaces, long string)
        base64Data = content
      } else {
        // Plain text - generate PDF using PDFKit
        const PDFDocument = (await import('pdfkit')).default
        const doc = new PDFDocument({ margin: 50 })

        // Collect PDF chunks
        const chunks: Buffer[] = []
        doc.on('data', (chunk: Buffer) => chunks.push(chunk))

        // Add text content with word wrapping
        doc.fontSize(12).text(content, {
          align: 'left',
          lineGap: 4
        })

        doc.end()

        // Wait for PDF generation to complete
        await new Promise<void>((resolve) => doc.on('end', resolve))

        const pdfBuffer = Buffer.concat(chunks)
        base64Data = pdfBuffer.toString('base64')
      }

      const metadataPart =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(fileMetadata)

      const mediaPart =
        delimiter +
        'Content-Type: application/pdf\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Data

      multipartBody = metadataPart + mediaPart + closeDelimiter
    } else {
      // Text-based files (txt, html, csv)
      multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(fileMetadata) +
        delimiter +
        'Content-Type: ' +
        mimeType +
        '\r\n\r\n' +
        content +
        closeDelimiter
    }

    const uploadUrl =
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size'

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
        size: result.size,
        webViewLink: result.webViewLink,
        message: 'File created successfully'
      }
    }
  } catch (error: any) {
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
    return { success: false, error: error.message || 'Failed to delete file' }
  }
}

/**
 * Get file content from Google Drive
 * Supports: text files, Google Docs, Google Sheets, PDFs, images
 * outputFormat: 'auto' (default) or 'binary' (raw base64)
 */
export const executeGetFileContent = async (
  config: any
): Promise<TNodeExecutionResult> => {
  try {
    const { fileId, credentialId, outputFormat = 'auto' } = config

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
      return {
        success: false,
        error: err?.error?.message || 'Failed to get file metadata'
      }
    }

    const metadata = await metadataResponse.json()
    const { mimeType, name } = metadata

    // Binary mode: return raw base64 for any file type
    if (outputFormat === 'binary') {
      // For Google Workspace files, we need to export them first
      let downloadUrl: string
      let effectiveMimeType = mimeType

      if (mimeType === 'application/vnd.google-apps.document') {
        // Export Google Docs as PDF to preserve formatting
        downloadUrl = API_ROUTES.GOOGLE_DRIVE.EXPORT_FILE(
          fileId,
          'application/pdf'
        )
        effectiveMimeType = 'application/pdf'
      } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        // Export Google Sheets as PDF
        downloadUrl = API_ROUTES.GOOGLE_DRIVE.EXPORT_FILE(
          fileId,
          'application/pdf'
        )
        effectiveMimeType = 'application/pdf'
      } else if (mimeType === 'application/vnd.google-apps.presentation') {
        // Export Google Slides as PDF
        downloadUrl = API_ROUTES.GOOGLE_DRIVE.EXPORT_FILE(
          fileId,
          'application/pdf'
        )
        effectiveMimeType = 'application/pdf'
      } else {
        // Regular files - download directly
        downloadUrl = API_ROUTES.GOOGLE_DRIVE.GET_FILE_CONTENT(fileId)
      }

      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return {
          success: false,
          error: err?.error?.message || 'Failed to download file'
        }
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${effectiveMimeType};base64,${base64}`

      return {
        success: true,
        data: {
          fileId,
          name,
          mimeType: effectiveMimeType,
          originalMimeType: mimeType,
          content: dataUrl,
          contentLength: buffer.length,
          outputFormat: 'binary'
        }
      }
    }

    // Auto mode: process based on file type
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
        return {
          success: false,
          error: 'Failed to parse PDF content: ' + pdfError.message
        }
      }
    } else if (mimeType.startsWith('image/')) {
      // Image files - download and return as base64
      const downloadUrl = API_ROUTES.GOOGLE_DRIVE.GET_FILE_CONTENT(fileId)
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const err = await response.json()
        return {
          success: false,
          error: err?.error?.message || 'Failed to download image'
        }
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${mimeType};base64,${base64}`

      return {
        success: true,
        data: {
          fileId,
          name,
          mimeType,
          content: dataUrl,
          contentLength: buffer.length,
          isImage: true
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
      // Unsupported file type in auto mode - suggest using binary mode
      return {
        success: false,
        error: `Unsupported file type for auto mode: ${mimeType}. Use "Binary (Base64)" output format to get raw file data.`
      }
    }

    return {
      success: true,
      data: {
        fileId,
        name,
        mimeType,
        content,
        contentLength: content.length,
        outputFormat: 'auto'
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get file content'
    }
  }
}
