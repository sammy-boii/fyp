'use client'

import { NodeAction } from '@/types/node.types'
import { Play, Mail, MessageSquare } from 'lucide-react'
import { ManualTriggerForm } from './forms/ManualTriggerForm'
import { GmailWebhookTriggerForm } from './forms/GmailWebhookTriggerForm'
import { DiscordWebhookTriggerForm } from './forms/DiscordWebhookTriggerForm'
import {
  manualTriggerFormSchema,
  gmailWebhookTriggerFormSchema,
  discordWebhookTriggerFormSchema
} from '@/schema/nodes/trigger.schema'
import { TRIGGER_ACTION_ID } from '@shared/constants'

// Re-export for backwards compatibility with existing code
export const TRIGGER_NODE_ACTION_ID = TRIGGER_ACTION_ID

export const MANUAL_TRIGGER_ACTIONS: NodeAction[] = [
  {
    id: TRIGGER_NODE_ACTION_ID.MANUAL_TRIGGER,
    label: 'Manual Trigger',
    description: 'Manually start the workflow',
    icon: Play,
    configForm: <ManualTriggerForm />,
    configFormSchema: manualTriggerFormSchema
  }
]

export const GMAIL_WEBHOOK_TRIGGER_ACTIONS: NodeAction[] = [
  {
    id: TRIGGER_NODE_ACTION_ID.GMAIL_WEBHOOK_TRIGGER,
    label: 'Gmail Webhook',
    description: 'Trigger when new email arrives',
    icon: Mail,
    requiresCredential: true,
    configForm: <GmailWebhookTriggerForm />,
    configFormSchema: gmailWebhookTriggerFormSchema
  }
]

export const DISCORD_WEBHOOK_TRIGGER_ACTIONS: NodeAction[] = [
  {
    id: TRIGGER_NODE_ACTION_ID.DISCORD_WEBHOOK_TRIGGER,
    label: 'Discord Webhook',
    description: 'Trigger when a message is sent in a channel',
    icon: MessageSquare,
    requiresCredential: true,
    configForm: <DiscordWebhookTriggerForm />,
    configFormSchema: discordWebhookTriggerFormSchema
  }
]

