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

export const TRIGGER_NODE_ACTION_ID = {
  MANUAL_TRIGGER: 'manual_trigger',
  GMAIL_WEBHOOK_TRIGGER: 'gmail_webhook_trigger',
  DISCORD_WEBHOOK_TRIGGER: 'discord_webhook_trigger'
} as const

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
    label: 'Discord Message',
    description: 'Trigger when a message is sent in a channel',
    icon: MessageSquare,
    configForm: <DiscordWebhookTriggerForm />,
    configFormSchema: discordWebhookTriggerFormSchema
  }
]
