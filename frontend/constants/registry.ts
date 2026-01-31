import gmailIcon from '@/public/gmail.png'
import driveIcon from '@/public/google-drive.png'
import discordIcon from '@/public/discord.png'
import googleDriveIcon from '@/public/google-drive.png'

import { NodeDefinition } from '@/types/node.types'
import { BACKEND_URL, NODE_TYPES } from '.'

import { GOOGLE_DRIVE_ACTIONS } from '@/components/editor/custom-nodes/google-drive/GoogleDriveActions'

import { DISCORD_ACTIONS } from '@/components/editor/custom-nodes/discord/DiscordActions'

import { GMAIL_ACTIONS } from '@/components/editor/custom-nodes/gmail/GmailActions'

export const NODE_DEFINITIONS: NodeDefinition = {
  [NODE_TYPES.GMAIL]: {
    label: 'Gmail',
    description: 'Connect your Gmail and manage emails',
    actions: GMAIL_ACTIONS,
    icon: gmailIcon
  },
  [NODE_TYPES.GOOGLE_DRIVE]: {
    label: 'Google Drive',
    actions: GOOGLE_DRIVE_ACTIONS,
    description: 'Access and manage files from your Google Drive',
    icon: driveIcon
  },
  [NODE_TYPES.DISCORD]: {
    label: 'Discord',
    actions: DISCORD_ACTIONS,
    description: 'Add a bot to a server to manage interactions',
    icon: discordIcon
  }
}

export const CREDENTIALS_OPTIONS = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: gmailIcon,
    url: `${BACKEND_URL}/api/gmail/oauth`,
    description: 'Connect your Gmail and manage emails'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: googleDriveIcon,
    url: `${BACKEND_URL}/api/google-drive/oauth`,
    description: 'Access and manage files from your Google Drive'
  },
  {
    id: 'bot',
    name: 'Discord',
    icon: discordIcon,
    url: 'https://discord.com/oauth2/authorize?client_id=1466759269763514513&permissions=0&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fdiscord%2Foauth&integration_type=0&scope=email+bot',
    description: 'Add a bot to a server to manage interactions'
  }
]
