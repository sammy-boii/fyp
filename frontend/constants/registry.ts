import gmailIcon from '@/public/gmail.png'
import cursorIcon from '@/public/cursor.svg'
import driveIcon from '@/public/google-drive.png'
import discordIcon from '@/public/discord.png'
import googleDriveIcon from '@/public/google-drive.png'
import aiIcon from '@/public/ai.svg'

import { NodeDefinition, TriggerNodeDefinition } from '@/types/node.types'
import { BACKEND_BASE_URL, NODE_TYPES, TRIGGER_NODE_TYPES } from '.'
import { TimerReset, GitBranch, Globe } from 'lucide-react'

import { GOOGLE_DRIVE_ACTIONS } from '@/components/editor/custom-nodes/google-drive/GoogleDriveActions'

import { DISCORD_ACTIONS } from '@/components/editor/custom-nodes/discord/DiscordActions'

import { GMAIL_ACTIONS } from '@/components/editor/custom-nodes/gmail/GmailActions'

import { CONDITION_ACTIONS } from '@/components/editor/custom-nodes/condition/ConditionActions'

import { AI_ACTIONS } from '@/components/editor/custom-nodes/ai/AIActions'

import { HTTP_ACTIONS } from '@/components/editor/custom-nodes/http/HTTPActions'

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
    color: '#FB7185',
    icon: gmailIcon
  },
  [NODE_TYPES.GOOGLE_DRIVE]: {
    label: 'Google Drive',
    actions: GOOGLE_DRIVE_ACTIONS,
    description: 'Access and manage files from your Google Drive',
    color: '#1A73E8',
    icon: driveIcon
  },
  [NODE_TYPES.DISCORD]: {
    label: 'Discord',
    actions: DISCORD_ACTIONS,
    description: 'Add a bot to a server to manage interactions',
    color: '#5865F2',
    icon: discordIcon
  },
  [NODE_TYPES.CONDITION]: {
    label: 'Condition',
    actions: CONDITION_ACTIONS,
    description: 'Route workflow based on conditions',
    color: '#F59E0B',
    iconComponent: GitBranch
  },
  [NODE_TYPES.AI]: {
    label: 'AI',
    actions: AI_ACTIONS,
    description: 'Ask AI anything and get intelligent responses',
    color: '#ed248f',
    icon: aiIcon,
    getSubtitle: ({ config }) => {
      const prompt =
        typeof config?.prompt === 'string' ? config.prompt.trim() : ''
      if (!prompt) {
        return 'Configure'
      }

      return prompt.length > 24 ? `${prompt.slice(0, 24)}...` : prompt
    }
  },
  [NODE_TYPES.HTTP]: {
    label: 'HTTP',
    actions: HTTP_ACTIONS,
    description: 'Make HTTP requests to external APIs',
    color: '#06B6D4',
    iconComponent: Globe,
    getSubtitle: ({ config }) => {
      const url = typeof config?.url === 'string' ? config.url.trim() : ''
      if (!url) {
        return 'Configure'
      }

      const method =
        typeof config?.method === 'string' ? config.method.toUpperCase() : 'GET'
      const displayUrl = url.replace(/^https?:\/\//, '')
      const truncated =
        displayUrl.length > 22 ? `${displayUrl.slice(0, 22)}...` : displayUrl

      return `${method} ${truncated}`
    }
  }
}

export const TRIGGER_NODE_DEFINITIONS: TriggerNodeDefinition = {
  [TRIGGER_NODE_TYPES.MANUAL_TRIGGER]: {
    label: 'Manual Trigger',
    description: 'Start the workflow manually',
    actions: MANUAL_TRIGGER_ACTIONS,
    color: '#8505ff',
    icon: cursorIcon,
    isTrigger: true
  },
  [TRIGGER_NODE_TYPES.GMAIL_WEBHOOK_TRIGGER]: {
    label: 'New Gmail',
    description: 'Trigger when a new email arrives',
    actions: GMAIL_WEBHOOK_TRIGGER_ACTIONS,
    color: '#FB7185',
    icon: gmailIcon,
    isTrigger: true
  },
  [TRIGGER_NODE_TYPES.DISCORD_WEBHOOK_TRIGGER]: {
    label: 'New Message',
    description: 'Trigger when a new message is sent',
    actions: DISCORD_WEBHOOK_TRIGGER_ACTIONS,
    color: '#5865F2',
    icon: discordIcon,
    isTrigger: true
  },
  [TRIGGER_NODE_TYPES.SCHEDULE_TRIGGER]: {
    label: 'Schedule',
    description: 'Run on a date/time or repeat daily',
    actions: SCHEDULE_TRIGGER_ACTIONS,
    color: '#F97316',
    iconComponent: TimerReset,
    isTrigger: true
  }
}

export const CREDENTIALS_OPTIONS = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: gmailIcon,
    url: `${BACKEND_BASE_URL}/api/gmail/oauth`,
    description: 'Connect your Gmail and manage emails'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: googleDriveIcon,
    url: `${BACKEND_BASE_URL}/api/google-drive/oauth`,
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
