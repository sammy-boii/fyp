import { z } from 'zod'

// Send message to a channel via bot
export const sendChannelMessageFormSchema = z.object({
  guildId: z.string().min(1, 'Please select a server'),
  channelId: z.string().min(1, 'Please select a channel'),
  content: z.string().min(1, 'Please enter a message'),
  embedTitle: z.string().optional(),
  embedDescription: z.string().optional(),
  embedColor: z.string().optional()
})

// Send DM to a user via bot
export const sendDMFormSchema = z.object({
  guildId: z.string().min(1, 'Please select a server'),
  userId: z.string().min(1, 'Please select a user'),
  content: z.string().min(1, 'Please enter a message'),
  embedTitle: z.string().optional(),
  embedDescription: z.string().optional()
})

// Send message via webhook (doesn't require bot token)
export const sendMessageFormSchema = z.object({
  webhookUrl: z.string().url('Please enter a valid webhook URL'),
  content: z.string().min(1, 'Please enter a message'),
  username: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal(''))
})

// List guilds (servers) the bot is in
export const listGuildsFormSchema = z.object({
  limit: z.coerce.number().min(1).max(200).optional()
})

// List channels in a guild
export const listChannelsFormSchema = z.object({
  guildId: z.string().min(1, 'Please enter a server ID'),
  channelType: z
    .enum(['all', 'text', 'voice', 'category', 'announcement', 'forum'])
    .optional()
})

// Create a channel in a guild
export const createChannelFormSchema = z.object({
  guildId: z.string().min(1, 'Please enter a server ID'),
  name: z.string().min(1, 'Please enter a channel name').max(100),
  type: z.enum(['text', 'voice', 'announcement', 'forum']).default('text'),
  topic: z.string().max(1024).optional(),
  parentId: z.string().optional()
})
