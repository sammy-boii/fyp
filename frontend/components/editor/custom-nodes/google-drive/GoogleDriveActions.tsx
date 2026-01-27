'use client'

import { NodeAction } from '@/types/node.types'
import { FolderPlus, FolderMinus, List, Trash2 } from 'lucide-react'
import { CreateFolderForm } from './forms/CreateFolderForm'
import { DeleteFolderForm } from './forms/DeleteFolderForm'
import { ListFilesForm } from './forms/ListFilesForm'
import { DeleteFileForm } from './forms/DeleteFileForm'
import {
  createFolderFormSchema,
  deleteFolderFormSchema,
  listFilesFormSchema,
  deleteFileFormSchema
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
