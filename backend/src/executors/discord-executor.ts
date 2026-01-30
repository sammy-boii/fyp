import { TNodeExecutionResult } from '../types/workflow.types'
import { getDiscordBotToken } from '../lib/credentials'

// Discord API base URL
const DISCORD_API = 'https://discord.com/api/v10'

// Channel type mapping
const CHANNEL_TYPES = {
  text: 0,
  voice: 2,
  category: 4,
  announcement: 5,
  forum: 15
} as const

// Helper to make Discord API requests
async function discordRequest(
  endpoint: string,
  botToken: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${DISCORD_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      error.message ||
        `Discord API error: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

// Helper to build embed object
function buildEmbed(
  title?: string,
  description?: string,
  color?: string
): object | null {
  if (!title && !description) return null

  const embed: any = {}
  if (title) embed.title = title
  if (description) embed.description = description
  if (color) {
    // Convert hex color to decimal
    embed.color = parseInt(color.replace('#', ''), 16)
  }

  return embed
}

// Send a message to a channel
export async function executeSendChannelMessage(
  config: any
): Promise<TNodeExecutionResult> {
  try {
    const {
      channelId,
      content,
      embedTitle,
      embedDescription,
      embedColor,
      credentialId
    } = config

    if (!credentialId) {
      return { success: false, error: 'Discord credential is required' }
    }

    const botToken = await getDiscordBotToken(credentialId)

    const body: any = { content }
    const embed = buildEmbed(embedTitle, embedDescription, embedColor)
    if (embed) {
      body.embeds = [embed]
    }

    const message = await discordRequest(
      `/channels/${channelId}/messages`,
      botToken,
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    )

    return {
      success: true,
      data: {
        messageId: message.id,
        channelId: message.channel_id,
        content: message.content,
        timestamp: message.timestamp,
        author: {
          id: message.author.id,
          username: message.author.username
        }
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send channel message'
    }
  }
}

// Send a direct message to a user
export async function executeSendDM(
  config: any
): Promise<TNodeExecutionResult> {
  try {
    const { userId, content, embedTitle, embedDescription, credentialId } =
      config

    if (!credentialId) {
      return { success: false, error: 'Discord credential is required' }
    }

    const botToken = await getDiscordBotToken(credentialId)

    // First, create a DM channel with the user
    const dmChannel = await discordRequest('/users/@me/channels', botToken, {
      method: 'POST',
      body: JSON.stringify({ recipient_id: userId })
    })

    // Then send the message to the DM channel
    const body: any = { content }
    const embed = buildEmbed(embedTitle, embedDescription)
    if (embed) {
      body.embeds = [embed]
    }

    const message = await discordRequest(
      `/channels/${dmChannel.id}/messages`,
      botToken,
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    )

    return {
      success: true,
      data: {
        messageId: message.id,
        channelId: message.channel_id,
        recipientId: userId,
        content: message.content,
        timestamp: message.timestamp
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send direct message'
    }
  }
}

// List guilds (servers) the bot is in
export async function executeListGuilds(
  config: any
): Promise<TNodeExecutionResult> {
  try {
    const { limit = 100, credentialId } = config

    if (!credentialId) {
      return { success: false, error: 'Discord credential is required' }
    }

    const botToken = await getDiscordBotToken(credentialId)

    const guilds = await discordRequest(
      `/users/@me/guilds?limit=${limit}`,
      botToken
    )

    return {
      success: true,
      data: {
        guilds: guilds.map((guild: any) => ({
          id: guild.id,
          name: guild.name,
          icon: guild.icon
            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
            : null,
          owner: guild.owner,
          permissions: guild.permissions
        })),
        count: guilds.length
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to list guilds'
    }
  }
}

// List channels in a guild
export async function executeListChannels(
  config: any
): Promise<TNodeExecutionResult> {
  try {
    const { guildId, channelType, credentialId } = config

    if (!credentialId) {
      return { success: false, error: 'Discord credential is required' }
    }

    const botToken = await getDiscordBotToken(credentialId)

    const channels = await discordRequest(
      `/guilds/${guildId}/channels`,
      botToken
    )

    // Filter by channel type if specified
    let filteredChannels = channels
    if (channelType && channelType !== 'all') {
      const typeId = CHANNEL_TYPES[channelType as keyof typeof CHANNEL_TYPES]
      if (typeId !== undefined) {
        filteredChannels = channels.filter((c: any) => c.type === typeId)
      }
    }

    return {
      success: true,
      data: {
        channels: filteredChannels.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          type:
            Object.entries(CHANNEL_TYPES).find(
              ([, v]) => v === channel.type
            )?.[0] || 'unknown',
          position: channel.position,
          parentId: channel.parent_id,
          topic: channel.topic
        })),
        count: filteredChannels.length
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to list channels'
    }
  }
}

// Create a channel in a guild
export async function executeCreateChannel(
  config: any
): Promise<TNodeExecutionResult> {
  try {
    const {
      guildId,
      name,
      type = 'text',
      topic,
      parentId,
      credentialId
    } = config

    if (!credentialId) {
      return { success: false, error: 'Discord credential is required' }
    }

    const botToken = await getDiscordBotToken(credentialId)

    const body: any = {
      name,
      type: CHANNEL_TYPES[type as keyof typeof CHANNEL_TYPES] || 0
    }

    if (topic) body.topic = topic
    if (parentId) body.parent_id = parentId

    const channel = await discordRequest(
      `/guilds/${guildId}/channels`,
      botToken,
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    )

    return {
      success: true,
      data: {
        id: channel.id,
        name: channel.name,
        type: type,
        guildId: channel.guild_id,
        position: channel.position,
        parentId: channel.parent_id,
        topic: channel.topic
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create channel'
    }
  }
}
