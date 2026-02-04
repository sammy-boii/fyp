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
  console.log(
    '[Discord normalizeAttachmentInputs] Received:',
    typeof attachmentInput,
    Array.isArray(attachmentInput) ? 'array' : ''
  )

  if (!attachmentInput) return []

  if (Array.isArray(attachmentInput)) {
    console.log(
      '[Discord] Input is array with',
      attachmentInput.length,
      'items'
    )
    return attachmentInput.flatMap((item) => normalizeAttachmentInputs(item))
  }

  if (typeof attachmentInput === 'string') {
    const trimmed = attachmentInput.trim()
    console.log(
      '[Discord] Input is string, length:',
      trimmed.length,
      'starts with:',
      trimmed.slice(0, 50)
    )
    if (!trimmed) return []

    if (isProbablyBase64String(trimmed)) {
      console.log('[Discord] Detected as base64 string')
      return [{ type: 'base64', value: trimmed }]
    }

    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        const parsed = JSON.parse(trimmed)
        console.log('[Discord] Parsed JSON successfully')
        return normalizeAttachmentInputs(parsed as AttachmentInput)
      } catch {
        console.log('[Discord] JSON parse failed')
        // fallthrough to treat as URLs
      }
    }

    console.log('[Discord] Treating as URL(s)')
    return trimmed
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean)
  }

  console.log(
    '[Discord] Input is object:',
    JSON.stringify({
      type: (attachmentInput as any).type,
      hasData: !!(attachmentInput as any).data,
      hasFilename: !!(attachmentInput as any).filename,
      hasMimeType: !!(attachmentInput as any).mimeType
    })
  )
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
  console.log('[Discord normalizeAttachmentSpec] Input type:', typeof input)
  console.log(
    '[Discord normalizeAttachmentSpec] Input:',
    typeof input === 'string'
      ? input.slice(0, 100)
      : JSON.stringify({
          type: input.type,
          hasData: !!input.data,
          hasValue: !!input.value,
          hasUrl: !!input.url,
          filename: input.filename,
          mimeType: input.mimeType,
          dataLength: input.data?.length,
          valueLength: input.value?.length
        })
  )

  if (typeof input === 'string') {
    console.log('[Discord] Path: string input')
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
      console.log('[Discord] Path: data URL parsed', {
        mimeType: parsed.mimeType
      })
      const mimeType =
        input.mimeType || parsed.mimeType || 'application/octet-stream'
      return {
        type: 'base64',
        data: parsed.data,
        filename: ensureFilenameExtension(
          input.filename || 'attachment',
          mimeType
        ),
        mimeType
      }
    }
  }

  if (input.url) {
    console.log('[Discord] Path: input.url')
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

    console.log('[Discord] Path: raw base64 data', {
      hasFilename: !!input.filename,
      filename: input.filename,
      hasMimeType: !!input.mimeType,
      inputMimeType: input.mimeType,
      inferredMimeType,
      finalMimeType: mimeType
    })

    return {
      type: 'base64',
      data: input.data,
      filename: ensureFilenameExtension(
        input.filename || 'attachment',
        mimeType
      ),
      mimeType
    }
  }

  if (input.type === 'url' && input.value) {
    console.log('[Discord] Path: type=url with value')
    return {
      type: 'url',
      value: input.value,
      filename: input.filename || getFileNameFromUrl(input.value, 0),
      mimeType: input.mimeType || 'application/octet-stream'
    }
  }

  if (input.type === 'base64' && input.value) {
    console.log('[Discord] Path: type=base64 with value')
    const parsed = parseDataUrl(input.value)
    const inferredMimeType =
      input.mimeType ||
      parsed?.mimeType ||
      detectMimeTypeFromBase64(input.value)
    const mimeType = inferredMimeType || 'application/octet-stream'
    return {
      type: 'base64',
      data: parsed?.data || input.value,
      filename: ensureFilenameExtension(
        input.filename || 'attachment',
        mimeType
      ),
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

function parseDataUrl(
  value: string
): { mimeType: string; data: string } | null {
  if (!value.startsWith('data:')) return null
  const match = value.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return { mimeType: match[1], data: match[2] }
}

function ensureFilenameExtension(filename: string, mimeType: string): string {
  // If filename already has an extension, use it as-is
  if (filename.includes('.')) return filename

  // Try to get extension from mimeType
  const extension = extensionFromMimeType(mimeType)
  if (extension) {
    return `${filename}.${extension}`
  }

  // Fallback to .bin only if we really can't determine the type
  return `${filename}.bin`
}

function extensionFromMimeType(mimeType: string): string | null {
  if (!mimeType) return null
  const normalized = mimeType.toLowerCase().split(';')[0].trim()

  // Skip generic binary type - let it fall through to .bin
  if (normalized === 'application/octet-stream') return null

  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls'
  }

  return map[normalized] || null
}

function detectMimeTypeFromBase64(value: string): string | null {
  const cleaned = value.includes('base64,')
    ? value.split('base64,').pop() || ''
    : value

  // For Office documents, we need MORE data to detect the internal structure
  // ZIP central directory can be further into the file
  const largeSample = cleaned.replace(/\s/g, '').slice(0, 8000)
  const sample = largeSample.slice(0, 120)
  if (!sample) return null

  let buffer: Buffer
  let largeBuffer: Buffer
  try {
    buffer = Buffer.from(sample, 'base64')
    largeBuffer = Buffer.from(largeSample, 'base64')
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

  // ZIP-based formats (DOCX, XLSX, etc): PK header (50 4B 03 04)
  if (
    header.length >= 4 &&
    header[0] === 0x50 &&
    header[1] === 0x4b &&
    header[2] === 0x03 &&
    header[3] === 0x04
  ) {
    // Check for Office Open XML markers in the file content
    // Use the full buffer we have available
    const contentStr = largeBuffer.toString('utf8', 0, largeBuffer.length)

    // Debug: log what we find
    console.log('[XLSX Debug] Buffer length:', largeBuffer.length)
    console.log('[XLSX Debug] Has xl/:', contentStr.includes('xl/'))
    console.log('[XLSX Debug] Has word/:', contentStr.includes('word/'))
    console.log(
      '[XLSX Debug] Has [Content_Types]:',
      contentStr.includes('[Content_Types]')
    )

    // Also try looking for specific XLSX markers
    const hasXlWorkbook = contentStr.includes('xl/workbook')
    const hasXlSharedStrings = contentStr.includes('xl/sharedStrings')
    const hasXlStyles = contentStr.includes('xl/styles')
    const hasXlSlash = contentStr.includes('xl/')

    console.log(
      '[XLSX Debug] xl/workbook:',
      hasXlWorkbook,
      'xl/sharedStrings:',
      hasXlSharedStrings,
      'xl/styles:',
      hasXlStyles,
      'xl/:',
      hasXlSlash
    )

    // Check for specific folder markers
    const hasXl =
      hasXlSlash || hasXlWorkbook || hasXlSharedStrings || hasXlStyles
    const hasWord =
      contentStr.includes('word/') || contentStr.includes('word/document')
    const hasPpt =
      contentStr.includes('ppt/') || contentStr.includes('ppt/presentation')

    // Return based on which marker is found - prioritize xl/ for spreadsheets
    if (hasXl) {
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    if (hasPpt) {
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }

    if (hasWord) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    // Generic Office Open XML (has [Content_Types].xml but couldn't identify specific type)
    if (
      contentStr.includes('[Content_Types].xml') ||
      contentStr.includes('Content_Types')
    ) {
      // Default to docx if we can't tell
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    // Regular ZIP file - return null to let it fall back to .bin
    return null
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
