import { tryCatch } from '@/src/lib/utils'
import { getDiscordBotToken } from '@/src/lib/credentials'
import { AppError } from '@/src/types'
import { prisma } from '@shared/db/prisma'

import { ContentfulStatusCode } from 'hono/utils/http-status'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

function logErr(res: Response, ctx: string) {
  console.log(`[ERROR] [${ctx}] `, res.status, res.statusText, res)
}

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
      `[DISCORD ERROR] ${endpoint} ${response.statusText} ${response.status} ${error.message ?? ''}`,
      500
    )
  }

  return response.json()
}

/**
 * List guilds (servers) that the user has authorized the bot for
 * Only returns guilds that the specific user added, not all guilds the bot is in
 */
export const listGuilds = tryCatch(async (c) => {
  const user = c.get('user')
  const credentialId = c.req.query('credentialId')

  if (!credentialId) {
    throw new AppError('Credential ID is required', 400)
  }

  // Verify the credential belongs to the user and get associated guilds
  const credential = await prisma.oAuthCredential.findFirst({
    where: {
      id: credentialId,
      userId: user.id,
      provider: 'discord'
    },
    include: {
      discordGuilds: true
    }
  })

  if (!credential) {
    throw new AppError('Discord credential not found', 404)
  }

  // If no guilds are authorized, return empty array
  if (!credential.discordGuilds || credential.discordGuilds.length === 0) {
    return c.json({
      success: true,
      data: []
    })
  }

  const botToken = await getDiscordBotToken(credentialId)

  // Fetch full guild info from Discord API for each authorized guild
  const guildPromises = credential.discordGuilds.map(async (discordGuild) => {
    try {
      const guild = await discordRequest(
        `/guilds/${discordGuild.guildId}`,
        botToken
      )
      return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
          : null,
        owner: false // We don't have this info from /guilds/:id endpoint
      }
    } catch (error) {
      // If we can't fetch the guild (bot was removed), use stored info or skip
      if (discordGuild.guildName) {
        return {
          id: discordGuild.guildId,
          name: discordGuild.guildName,
          icon: null,
          owner: false
        }
      }
      return null
    }
  })

  const guildsResults = await Promise.all(guildPromises)

  // Filter out null results (guilds that couldn't be fetched and have no stored name)
  const items = guildsResults.filter((guild) => guild !== null)

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
  const channels = await discordRequest(`/guilds/${guildId}/channels`, botToken)

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
