import { TNodeExecutionResult } from '../types/workflow.types'
import { getDiscordBotToken } from '../lib/credentials'
import { API_ROUTES } from '../constants'

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
  const isMultipart =
    typeof FormData !== 'undefined' && options.body instanceof FormData

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      Authorization: `Bot ${botToken}`,
      ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
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

function normalizeAttachmentUrls(attachmentUrls?: string | string[]): string[] {
  if (!attachmentUrls) return []
  if (Array.isArray(attachmentUrls)) {
    return attachmentUrls.map((url) => url.trim()).filter(Boolean)
  }
  return attachmentUrls
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean)
}

function getFileNameFromUrl(url: string, index: number) {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname
    const lastSegment = pathname.split('/').pop()
    return lastSegment && lastSegment.length > 0
      ? lastSegment
      : `attachment-${index + 1}`
  } catch {
    return `attachment-${index + 1}`
  }
}

async function buildMessagePayload(
  content: string,
  embed: object | null,
  attachmentUrls?: string | string[]
): Promise<{ body: BodyInit; isMultipart: boolean }> {
  const urls = normalizeAttachmentUrls(attachmentUrls)

  if (urls.length === 0) {
    const jsonBody: any = { content }
    if (embed) {
      jsonBody.embeds = [embed]
    }
    return { body: JSON.stringify(jsonBody), isMultipart: false }
  }

  const formData = new FormData()
  const payload: any = { content }
  if (embed) {
    payload.embeds = [embed]
  }
  formData.append('payload_json', JSON.stringify(payload))

  await Promise.all(
    urls.map(async (url, index) => {
      const fileResponse = await fetch(url)
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch attachment: ${url}`)
      }
      const arrayBuffer = await fileResponse.arrayBuffer()
      const fileName = getFileNameFromUrl(url, index)
      const contentType =
        fileResponse.headers.get('content-type') || 'application/octet-stream'

      formData.append(
        `files[${index}]`,
        new Blob([arrayBuffer], { type: contentType }),
        fileName
      )
    })
  )

  return { body: formData, isMultipart: true }
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
      attachmentUrls,
      credentialId
    } = config

    if (!credentialId) {
      return { success: false, error: 'Discord credential is required' }
    }

    const botToken = await getDiscordBotToken(credentialId)

    const embed = buildEmbed(embedTitle, embedDescription, embedColor)
    const { body } = await buildMessagePayload(content, embed, attachmentUrls)

    const message = await discordRequest(
      API_ROUTES.DISCORD.GET_CHANNEL_MESSAGES(channelId),
      botToken,
      {
        method: 'POST',
        body
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
    const {
      userId,
      content,
      embedTitle,
      embedDescription,
      attachmentUrls,
      credentialId
    } = config

    if (!credentialId) {
      return { success: false, error: 'Discord credential is required' }
    }

    const botToken = await getDiscordBotToken(credentialId)

    // First, create a DM channel with the user
    const dmChannel = await discordRequest(
      API_ROUTES.DISCORD.CREATE_DM_CHANNEL,
      botToken,
      {
        method: 'POST',
        body: JSON.stringify({ recipient_id: userId })
      }
    )

    // Then send the message to the DM channel
    const embed = buildEmbed(embedTitle, embedDescription)
    const { body } = await buildMessagePayload(content, embed, attachmentUrls)

    const message = await discordRequest(
      API_ROUTES.DISCORD.SEND_DM(dmChannel.id),
      botToken,
      {
        method: 'POST',
        body
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
      API_ROUTES.DISCORD.LIST_GUIDS(limit),
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
      API_ROUTES.DISCORD.LIST_CHANNELS(guildId),
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
      API_ROUTES.DISCORD.CREATE_CHANNEL(guildId),
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
