import { GMAIL_ACTIONS } from '@/components/editor/custom-nodes/gmail/GmailActions'
import gmailIcon from '@/public/gmail.png'
import driveIcon from '@/public/google-drive.png'
import discordIcon from '@/public/discord.png'
import { NodeDefinition } from '@/types/node.types'
import { NODE_TYPES } from '.'
import { GOOGLE_DRIVE_ACTIONS } from '@/components/editor/custom-nodes/google-drive/GoogleDriveActions'
import { DISCORD_ACTIONS } from '@/components/editor/custom-nodes/discord/DiscordActions'

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
  },
  [NODE_TYPES.DISCORD]: {
    label: 'Discord',
    actions: DISCORD_ACTIONS,
    description: 'Discord bot node',
    icon: discordIcon
  }
}
