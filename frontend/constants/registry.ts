import { GMAIL_ACTIONS } from '@/components/editor/custom-nodes/gmail/GmailActions'
import gmailIcon from '@/public/gmail.png'
import driveIcon from '@/public/google-drive.png'
import { NodeDefinition } from '@/types/node.types'
import { NODE_TYPES } from '.'
import { GOOGLE_DRIVE_ACTIONS } from '@/components/editor/custom-nodes/google-drive/GoogleDriveActions'

export const NODE_DEFINITIONS: NodeDefinition = {
  [NODE_TYPES.GMAIL]: {
    label: 'Gmail',
    description: 'Gmail node',
    actions: GMAIL_ACTIONS,
    icon: gmailIcon
  },
  [NODE_TYPES.GOOGLE_DRIVE]: {
    label: 'Google Drive',
    actions: GOOGLE_DRIVE_ACTIONS,
    description: 'Google Drive node',
    icon: driveIcon
  }
}
