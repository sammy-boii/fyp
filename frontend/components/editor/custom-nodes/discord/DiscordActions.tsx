'use client'

import { NodeAction } from '@/types/node.types'
import { MessageSquare, Hash, Users, AtSign } from 'lucide-react'
import { SendChannelMessageForm } from './forms/SendChannelMessageForm'
import { ListGuildsForm } from './forms/ListGuildsForm'
import { ListChannelsForm } from './forms/ListChannelsForm'
import { CreateChannelForm } from './forms/CreateChannelForm'
import { SendDMForm } from './forms/SendDMForm'
import {
  sendChannelMessageFormSchema,
  listGuildsFormSchema,
  listChannelsFormSchema,
  createChannelFormSchema,
  sendDMFormSchema
} from '@/schema/nodes/discord.schema'
import { NODE_ACTION_ID } from '@shared/constants'

export const DISCORD_ACTIONS: NodeAction[] = [
  {
    id: NODE_ACTION_ID.DISCORD.SEND_CHANNEL_MESSAGE,
    label: 'Send Channel Message',
    description: 'Send a message to a Discord channel',
    icon: Hash,
    configForm: <SendChannelMessageForm />,
    configFormSchema: sendChannelMessageFormSchema
  },
  {
    id: NODE_ACTION_ID.DISCORD.SEND_DM,
    label: 'Send Direct Message',
    description: 'Send a direct message to a user',
    icon: AtSign,
    configForm: <SendDMForm />,
    configFormSchema: sendDMFormSchema
  },
  {
    id: NODE_ACTION_ID.DISCORD.LIST_GUILDS,
    label: 'List Servers',
    description: 'List all servers the bot is in',
    icon: Users,
    configForm: <ListGuildsForm />,
    configFormSchema: listGuildsFormSchema
  },
  {
    id: NODE_ACTION_ID.DISCORD.LIST_CHANNELS,
    label: 'List Channels',
    description: 'List all channels in a server',
    icon: MessageSquare,
    configForm: <ListChannelsForm />,
    configFormSchema: listChannelsFormSchema
  },
  {
    id: NODE_ACTION_ID.DISCORD.CREATE_CHANNEL,
    label: 'Create Channel',
    description: 'Create a new channel in a server',
    icon: Hash,
    configForm: <CreateChannelForm />,
    configFormSchema: createChannelFormSchema
  }
]
