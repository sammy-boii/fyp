import gmailIcon from '@/public/gmail.png'
import cursorIcon from '@/public/cursor.svg'
import driveIcon from '@/public/google-drive.png'
import discordIcon from '@/public/discord.png'
import googleDriveIcon from '@/public/google-drive.png'

import { NodeDefinition, TriggerNodeDefinition } from '@/types/node.types'
import { BACKEND_URL, NODE_TYPES, TRIGGER_NODE_TYPES } from '.'
import { TimerReset } from 'lucide-react'

import { GOOGLE_DRIVE_ACTIONS } from '@/components/editor/custom-nodes/google-drive/GoogleDriveActions'

import { DISCORD_ACTIONS } from '@/components/editor/custom-nodes/discord/DiscordActions'

import { GMAIL_ACTIONS } from '@/components/editor/custom-nodes/gmail/GmailActions'

import {
  MANUAL_TRIGGER_ACTIONS,
  GMAIL_WEBHOOK_TRIGGER_ACTIONS,
  DISCORD_WEBHOOK_TRIGGER_ACTIONS,
  SCHEDULE_TRIGGER_ACTIONS
} from '@/components/editor/custom-nodes/triggers/TriggerActions'

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

export const TRIGGER_NODE_DEFINITIONS: TriggerNodeDefinition = {
  [TRIGGER_NODE_TYPES.MANUAL_TRIGGER]: {
    label: 'Manual Trigger',
    description: 'Start the workflow manually',
    actions: MANUAL_TRIGGER_ACTIONS,
    icon: cursorIcon,
    isTrigger: true
  },
  [TRIGGER_NODE_TYPES.GMAIL_WEBHOOK_TRIGGER]: {
    label: 'New Gmail',
    description: 'Trigger when a new email arrives',
    actions: GMAIL_WEBHOOK_TRIGGER_ACTIONS,
    icon: gmailIcon,
    isTrigger: true
  },
  [TRIGGER_NODE_TYPES.DISCORD_WEBHOOK_TRIGGER]: {
    label: 'New Message',
    description: 'Trigger when a new message is sent',
    actions: DISCORD_WEBHOOK_TRIGGER_ACTIONS,
    icon: discordIcon,
    isTrigger: true
  },
  [TRIGGER_NODE_TYPES.SCHEDULE_TRIGGER]: {
    label: 'Schedule',
    description: 'Run on a date/time or repeat daily',
    actions: SCHEDULE_TRIGGER_ACTIONS,
    iconComponent: TimerReset,
    isTrigger: true
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
    url: 'https://discord.com/oauth2/authorize?client_id=1466759269763514513&permissions=8&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fdiscord%2Foauth&integration_type=0&scope=email+bot',
    description: 'Add a bot to a server to manage interactions'
  }
]
