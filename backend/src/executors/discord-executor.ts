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

type AttachmentInput =
  | string
  | {
      type?: 'url' | 'base64' | 'drive'
      value?: string
      url?: string
      data?: string
      filename?: string
      mimeType?: string
    }

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

function normalizeAttachmentInputs(
  attachmentInput?: AttachmentInput | AttachmentInput[]
): AttachmentInput[] {
  if (!attachmentInput) return []

  if (Array.isArray(attachmentInput)) {
    return attachmentInput.flatMap((item) => normalizeAttachmentInputs(item))
  }

  if (typeof attachmentInput === 'string') {
    const trimmed = attachmentInput.trim()
    if (!trimmed) return []

    if (isProbablyBase64String(trimmed)) {
      return [{ type: 'base64', value: trimmed }]
    }

    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        const parsed = JSON.parse(trimmed)
        return normalizeAttachmentInputs(parsed as AttachmentInput)
      } catch {
        // fallthrough to treat as URLs
      }
    }

    return trimmed
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean)
  }

  return [attachmentInput]
}

function isProbablyBase64String(value: string): boolean {
  if (value.startsWith('data:') && value.includes('base64,')) {
    return true
  }

  if (value.includes('://')) return false
  if (value.length < 80) return false

  const sample = value.replace(/\s/g, '').slice(0, 200)
  return /^[A-Za-z0-9+/=]+$/.test(sample)
}

function normalizeAttachmentSpec(input: AttachmentInput): {
  type: 'url' | 'base64' | 'drive'
  value?: string
  data?: string
  filename: string
  mimeType: string
} | null {
  if (typeof input === 'string') {
    return {
      type: 'url',
      value: input,
      filename: getFileNameFromUrl(input, 0),
      mimeType: 'application/octet-stream'
    }
  }

  if (input.data) {
    const parsed = parseDataUrl(input.data)
    if (parsed) {
      const mimeType =
        input.mimeType || parsed.mimeType || 'application/octet-stream'
      return {
        type: 'base64',
        data: parsed.data,
        filename: ensureFilenameExtension(input.filename || 'attachment', mimeType),
        mimeType
      }
    }
  }

  if (input.url) {
    return {
      type: 'url',
      value: input.url,
      filename: input.filename || getFileNameFromUrl(input.url, 0),
      mimeType: input.mimeType || 'application/octet-stream'
    }
  }

  if (input.data) {
    const inferredMimeType =
      input.mimeType || detectMimeTypeFromBase64(input.data)
    const mimeType = inferredMimeType || 'application/octet-stream'
    return {
      type: 'base64',
      data: input.data,
      filename: ensureFilenameExtension(input.filename || 'attachment', mimeType),
      mimeType
    }
  }

  if (input.type === 'url' && input.value) {
    return {
      type: 'url',
      value: input.value,
      filename: input.filename || getFileNameFromUrl(input.value, 0),
      mimeType: input.mimeType || 'application/octet-stream'
    }
  }

  if (input.type === 'base64' && input.value) {
    const parsed = parseDataUrl(input.value)
    const inferredMimeType =
      input.mimeType ||
      parsed?.mimeType ||
      detectMimeTypeFromBase64(input.value)
    const mimeType = inferredMimeType || 'application/octet-stream'
    return {
      type: 'base64',
      data: parsed?.data || input.value,
      filename: ensureFilenameExtension(input.filename || 'attachment', mimeType),
      mimeType
    }
  }

  if (input.type === 'drive' && input.value) {
    return {
      type: 'drive',
      value: input.value,
      filename: input.filename || 'attachment',
      mimeType: input.mimeType || 'application/octet-stream'
    }
  }

  return null
}

function parseDataUrl(value: string): { mimeType: string; data: string } | null {
  if (!value.startsWith('data:')) return null
  const match = value.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return { mimeType: match[1], data: match[2] }
}

function ensureFilenameExtension(filename: string, mimeType: string): string {
  if (filename.includes('.')) return filename
  const extension = extensionFromMimeType(mimeType)
  return extension ? `${filename}.${extension}` : `${filename}.bin`
}

function extensionFromMimeType(mimeType: string): string | null {
  const normalized = mimeType.toLowerCase().split(';')[0].trim()
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/zip': 'zip',
    'application/json': 'json',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'video/mp4': 'mp4'
  }

  return map[normalized] || null
}

function detectMimeTypeFromBase64(value: string): string | null {
  const cleaned = value.includes('base64,')
    ? value.split('base64,').pop() || ''
    : value
  const sample = cleaned.replace(/\s/g, '').slice(0, 120)
  if (!sample) return null

  let buffer: Buffer
  try {
    buffer = Buffer.from(sample, 'base64')
  } catch {
    return null
  }

  const header = buffer.subarray(0, 12)

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  ) {
    return 'image/png'
  }

  // JPEG: FF D8 FF
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8) {
    return 'image/jpeg'
  }

  // GIF: 47 49 46 38
  if (
    header.length >= 4 &&
    header[0] === 0x47 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x38
  ) {
    return 'image/gif'
  }

  // PDF: 25 50 44 46
  if (
    header.length >= 4 &&
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46
  ) {
    return 'application/pdf'
  }

  // ZIP: 50 4B 03 04
  if (
    header.length >= 4 &&
    header[0] === 0x50 &&
    header[1] === 0x4b &&
    header[2] === 0x03 &&
    header[3] === 0x04
  ) {
    return 'application/zip'
  }

  // WEBP: "RIFF"...."WEBP"
  if (
    header.length >= 12 &&
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return 'image/webp'
  }

  return null
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
  attachmentInputs?: AttachmentInput | AttachmentInput[]
): Promise<{ body: BodyInit; isMultipart: boolean }> {
  const inputs = normalizeAttachmentInputs(attachmentInputs)
  const attachments = inputs
    .map((item) => normalizeAttachmentSpec(item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  if (attachments.length === 0) {
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
    attachments.map(async (attachment, index) => {
      if (attachment.type === 'url') {
        const url = attachment.value || ''
        const fileResponse = await fetch(url)
        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch attachment: ${url}`)
        }
        const arrayBuffer = await fileResponse.arrayBuffer()
        const fileName = ensureFilenameExtension(
          attachment.filename || getFileNameFromUrl(url, index),
          contentType
        )
        const contentType =
          fileResponse.headers.get('content-type') || attachment.mimeType

        formData.append(
          `files[${index}]`,
          new Blob([arrayBuffer], { type: contentType }),
          fileName
        )
        return
      }

      if (attachment.type === 'base64') {
        const rawData = attachment.data || ''
        const cleaned = rawData.includes('base64,')
          ? rawData.split('base64,').pop() || ''
          : rawData
        const buffer = Buffer.from(cleaned, 'base64')
        const fileName = attachment.filename || `attachment-${index + 1}`
        formData.append(
          `files[${index}]`,
          new Blob([buffer], { type: attachment.mimeType }),
          fileName
        )
        return
      }

      throw new Error(
        'Drive attachments are not supported without file content.'
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
      attachmentData,
      attachmentFilename,
      attachmentMode,
      credentialId
    } = config

    if (!credentialId) {
      return { success: false, error: 'Discord credential is required' }
    }

    const botToken = await getDiscordBotToken(credentialId)

    const embed = buildEmbed(embedTitle, embedDescription, embedColor)
    const attachmentInput =
      attachmentMode === 'base64'
        ? attachmentData
          ? attachmentData.trim().startsWith('[') ||
            attachmentData.trim().startsWith('{')
            ? attachmentData
            : {
                type: 'base64',
                value: attachmentData,
                filename: attachmentFilename
              }
          : undefined
        : attachmentUrls

    const { body } = await buildMessagePayload(content, embed, attachmentInput)

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
      attachmentData,
      attachmentFilename,
      attachmentMode,
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
    const attachmentInput =
      attachmentMode === 'base64'
        ? attachmentData
          ? attachmentData.trim().startsWith('[') ||
            attachmentData.trim().startsWith('{')
            ? attachmentData
            : {
                type: 'base64',
                value: attachmentData,
                filename: attachmentFilename
              }
          : undefined
        : attachmentUrls

    const { body } = await buildMessagePayload(content, embed, attachmentInput)

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
