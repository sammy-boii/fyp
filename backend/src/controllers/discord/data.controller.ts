import { tryCatch } from '@/src/lib/utils'
import { getDiscordBotToken } from '@/src/lib/credentials'
import { AppError } from '@/src/types'
import { prisma } from '@shared/db/prisma'

import { ContentfulStatusCode } from 'hono/utils/http-status'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

// Helper to make Discord API requests
async function discordRequest(
  endpoint: string,
  botToken: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${DISCORD_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new AppError(
      error.message || `Discord API error: ${response.status}`,
      response.status as ContentfulStatusCode
    )
  }

  return response.json()
}

/**
 * List all guilds (servers) the bot is in
 * Used for dropdowns in the frontend
 */
export const listGuilds = tryCatch(async (c) => {
  const user = c.get('user')
  const credentialId = c.req.query('credentialId')

  if (!credentialId) {
    throw new AppError('Credential ID is required', 400)
  }

  // Verify the credential belongs to the user
  const credential = await prisma.oAuthCredential.findFirst({
    where: {
      id: credentialId,
      userId: user.id,
      provider: 'discord'
    }
  })

  if (!credential) {
    throw new AppError('Discord credential not found', 404)
  }

  const botToken = await getDiscordBotToken(credentialId)

  // Fetch guilds the bot is in
  const guilds = await discordRequest('/users/@me/guilds?limit=100', botToken)

  const items = guilds.map((guild: any) => ({
    id: guild.id,
    name: guild.name,
    icon: guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
      : null,
    owner: guild.owner
  }))

  return c.json({
    success: true,
    data: items
  })
})

/**
 * List channels in a guild
 * Used for dropdowns in the frontend
 */
export const listChannels = tryCatch(async (c) => {
  const user = c.get('user')
  const credentialId = c.req.query('credentialId')
  const guildId = c.req.query('guildId')
  const channelType = c.req.query('type') || 'all' // 'all', 'text', 'voice', 'category'

  if (!credentialId) {
    throw new AppError('Credential ID is required', 400)
  }

  if (!guildId) {
    throw new AppError('Guild ID is required', 400)
  }

  // Verify the credential belongs to the user
  const credential = await prisma.oAuthCredential.findFirst({
    where: {
      id: credentialId,
      userId: user.id,
      provider: 'discord'
    }
  })

  if (!credential) {
    throw new AppError('Discord credential not found', 404)
  }

  const botToken = await getDiscordBotToken(credentialId)

  // Fetch channels in the guild
  const channels = await discordRequest(
    `/guilds/${guildId}/channels`,
    botToken
  )

  // Channel type mapping
  const CHANNEL_TYPES: Record<string, number> = {
    text: 0,
    voice: 2,
    category: 4,
    announcement: 5,
    forum: 15
  }

  // Filter by channel type if specified
  let filteredChannels = channels
  if (channelType && channelType !== 'all') {
    const typeId = CHANNEL_TYPES[channelType]
    if (typeId !== undefined) {
      filteredChannels = channels.filter((c: any) => c.type === typeId)
    }
  }

  // Sort channels by position
  filteredChannels.sort((a: any, b: any) => a.position - b.position)

  const items = filteredChannels.map((channel: any) => ({
    id: channel.id,
    name: channel.name,
    type:
      Object.entries(CHANNEL_TYPES).find(([, v]) => v === channel.type)?.[0] ||
      'unknown',
    typeId: channel.type,
    position: channel.position,
    parentId: channel.parent_id || null,
    topic: channel.topic || null
  }))

  return c.json({
    success: true,
    data: items
  })
})

/**
 * List members in a guild
 * Used for user selection in DM forms
 * Note: Requires GUILD_MEMBERS intent
 */
export const listGuildMembers = tryCatch(async (c) => {
  const user = c.get('user')
  const credentialId = c.req.query('credentialId')
  const guildId = c.req.query('guildId')
  const limit = parseInt(c.req.query('limit') || '100', 10)

  if (!credentialId) {
    throw new AppError('Credential ID is required', 400)
  }

  if (!guildId) {
    throw new AppError('Guild ID is required', 400)
  }

  // Verify the credential belongs to the user
  const credential = await prisma.oAuthCredential.findFirst({
    where: {
      id: credentialId,
      userId: user.id,
      provider: 'discord'
    }
  })

  if (!credential) {
    throw new AppError('Discord credential not found', 404)
  }

  const botToken = await getDiscordBotToken(credentialId)

  // Fetch members in the guild
  const members = await discordRequest(
    `/guilds/${guildId}/members?limit=${Math.min(limit, 1000)}`,
    botToken
  )

  const items = members.map((member: any) => ({
    id: member.user.id,
    username: member.user.username,
    displayName: member.nick || member.user.global_name || member.user.username,
    avatar: member.user.avatar
      ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
      : null,
    isBot: member.user.bot || false
  }))

  // Filter out bots by default
  const nonBotMembers = items.filter((m: any) => !m.isBot)

  return c.json({
    success: true,
    data: nonBotMembers
  })
})
