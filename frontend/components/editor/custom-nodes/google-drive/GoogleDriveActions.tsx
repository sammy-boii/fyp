'use client'

import { NodeAction } from '@/types/node.types'
import { FolderPlus, FolderMinus, List, Trash2, FilePlus } from 'lucide-react'
import { CreateFolderForm } from './forms/CreateFolderForm'
import { CreateFileForm } from './forms/CreateFileForm'
import { DeleteFolderForm } from './forms/DeleteFolderForm'
import { ListFilesForm } from './forms/ListFilesForm'
import { DeleteFileForm } from './forms/DeleteFileForm'
import {
  createFolderFormSchema,
  createFileFormSchema,
  deleteFolderFormSchema,
  listFilesFormSchema,
  deleteFileFormSchema
} from '@/schema/nodes/google-drive.schema'
import { NODE_ACTION_ID } from '@shared/constants'

export const GOOGLE_DRIVE_ACTIONS: NodeAction[] = [
  {
    id: NODE_ACTION_ID['GOOGLE-DRIVE'].CREATE_FOLDER,
    label: 'Create Folder',
    description: 'Create a new folder in Google Drive',
    icon: FolderPlus,
    configForm: <CreateFolderForm />,
    configFormSchema: createFolderFormSchema
  },
  {
    id: NODE_ACTION_ID['GOOGLE-DRIVE'].CREATE_FILE,
    label: 'Create File',
    description: 'Create text, images, or PDF files in Google Drive',
    icon: FilePlus,
    configForm: <CreateFileForm />,
    configFormSchema: createFileFormSchema
  },
  {
    id: NODE_ACTION_ID['GOOGLE-DRIVE'].LIST_FILES,
    label: 'List Files',
    description: 'List files and folders in Google Drive',
    icon: List,
    configForm: <ListFilesForm />,
    configFormSchema: listFilesFormSchema
  },
  {
    id: NODE_ACTION_ID['GOOGLE-DRIVE'].DELETE_FILE,
    label: 'Delete File',
    description: 'Delete a file from Google Drive',
    icon: Trash2,
    configForm: <DeleteFileForm />,
    configFormSchema: deleteFileFormSchema
  },
  {
    id: NODE_ACTION_ID['GOOGLE-DRIVE'].DELETE_FOLDER,
    label: 'Delete Folder',
    description: 'Delete a folder from Google Drive',
    icon: FolderMinus,
    configForm: <DeleteFolderForm />,
    configFormSchema: deleteFolderFormSchema
  }
]
