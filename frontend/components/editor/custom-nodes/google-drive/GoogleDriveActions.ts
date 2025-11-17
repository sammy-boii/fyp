import { NodeAction } from '@/types/node.types'
import { Download, List, Upload } from 'lucide-react'

export const GOOGLE_DRIVE_ACTIONS: NodeAction[] = [
  {
    id: 'upload_file',
    label: 'Upload File',
    description: 'Upload a file to Google Drive',
    icon: Upload,
    fields: [
      {
        id: 'file_path',
        name: 'file_path',
        type: 'text',
        label: 'File Path',
        placeholder: '/path/to/file.pdf',
        required: true
      },
      {
        id: 'folder_id',
        name: 'folder_id',
        type: 'text',
        label: 'Folder ID',
        placeholder: 'Optional folder ID'
      },
      {
        id: 'file_name',
        name: 'file_name',
        type: 'text',
        label: 'File Name',
        placeholder: 'Custom file name (optional)'
      }
    ]
  },
  {
    id: 'download_file',
    label: 'Download File',
    description: 'Download a file from Google Drive',
    icon: Download,
    fields: [
      {
        id: 'file_id',
        name: 'file_id',
        type: 'text',
        label: 'File ID',
        placeholder: 'Google Drive file ID',
        required: true
      },
      {
        id: 'download_path',
        name: 'download_path',
        type: 'text',
        label: 'Download Path',
        placeholder: '/path/to/download/location',
        required: true
      }
    ]
  },
  {
    id: 'list_files',
    label: 'List Files',
    description: 'List files in Google Drive',
    icon: List,
    fields: [
      {
        id: 'folder_id',
        name: 'folder_id',
        type: 'text',
        label: 'Folder ID',
        placeholder: 'Optional folder ID to list files from'
      },
      {
        id: 'max_results',
        name: 'max_results',
        type: 'number',
        label: 'Max Results',
        defaultValue: 50
      },
      {
        id: 'file_type',
        name: 'file_type',
        type: 'select',
        label: 'File Type',
        options: [
          { value: 'all', label: 'All Files' },
          { value: 'pdf', label: 'PDF' },
          { value: 'image', label: 'Images' },
          { value: 'document', label: 'Documents' }
        ],
        defaultValue: 'all'
      }
    ]
  }
]
