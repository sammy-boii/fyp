import { z } from 'zod'

export const createFolderFormSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentFolderId: z.string().optional()
})

export const createFileFormSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  content: z.string().optional(),
  mimeType: z
    .enum([
      'text/plain',
      'text/html',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf'
    ])
    .default('text/plain'),
  parentFolderId: z.string().optional()
})

export const deleteFolderFormSchema = z.object({
  folderId: z.string().min(1, 'Folder ID is required')
})

export const listFilesFormSchema = z.object({
  folderId: z.string().optional(),
  maxResults: z.coerce
    .number()
    .min(1, 'Must fetch at least 1 file')
    .max(100, 'Maximum 100 files')
    .default(50),
  fileType: z
    .enum(['all', 'pdf', 'image', 'document', 'spreadsheet', 'folder'])
    .default('all')
})

export const deleteFileFormSchema = z.object({
  fileId: z.string().min(1, 'File ID is required')
})

export const getFileContentFormSchema = z.object({
  fileId: z.string().min(1, 'File ID is required')
})
