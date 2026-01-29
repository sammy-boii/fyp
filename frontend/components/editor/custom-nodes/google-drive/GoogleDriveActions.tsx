'use client'

import { NodeAction } from '@/types/node.types'
import {
  FolderPlus,
  FolderMinus,
  List,
  Trash2,
  FilePlus,
  FileText
} from 'lucide-react'
import { CreateFolderForm } from './forms/CreateFolderForm'
import { CreateFileForm } from './forms/CreateFileForm'
import { DeleteFolderForm } from './forms/DeleteFolderForm'
import { ListFilesForm } from './forms/ListFilesForm'
import { DeleteFileForm } from './forms/DeleteFileForm'
import { GetFileContentForm } from './forms/GetFileContentForm'
import {
  createFolderFormSchema,
  createFileFormSchema,
  deleteFolderFormSchema,
  listFilesFormSchema,
  deleteFileFormSchema,
  getFileContentFormSchema
} from '@/schema/nodes/google-drive.schema'
import { NODE_ACTION_ID } from '@shared/constants'

export const GOOGLE_DRIVE_ACTIONS: NodeAction[] = [
  {
    id: NODE_ACTION_ID.CREATE_FOLDER,
    label: 'Create Folder',
    description: 'Create a new folder in Google Drive',
    icon: FolderPlus,
    configForm: <CreateFolderForm />,
    configFormSchema: createFolderFormSchema
  },
  {
    id: NODE_ACTION_ID.CREATE_FILE,
    label: 'Create File',
    description: 'Create text, images, or PDF files in Google Drive',
    icon: FilePlus,
    configForm: <CreateFileForm />,
    configFormSchema: createFileFormSchema
  },
  {
    id: NODE_ACTION_ID.GET_FILE_CONTENT,
    label: 'Get File Content',
    description: 'Read content from a file (docs, sheets, PDFs, images)',
    icon: FileText,
    configForm: <GetFileContentForm />,
    configFormSchema: getFileContentFormSchema
  },
  {
    id: NODE_ACTION_ID.LIST_FILES,
    label: 'List Files',
    description: 'List files and folders in Google Drive',
    icon: List,
    configForm: <ListFilesForm />,
    configFormSchema: listFilesFormSchema
  },
  {
    id: NODE_ACTION_ID.DELETE_FILE,
    label: 'Delete File',
    description: 'Delete a file from Google Drive',
    icon: Trash2,
    configForm: <DeleteFileForm />,
    configFormSchema: deleteFileFormSchema
  },
  {
    id: NODE_ACTION_ID.DELETE_FOLDER,
    label: 'Delete Folder',
    description: 'Delete a folder from Google Drive',
    icon: FolderMinus,
    configForm: <DeleteFolderForm />,
    configFormSchema: deleteFolderFormSchema
  }
]
