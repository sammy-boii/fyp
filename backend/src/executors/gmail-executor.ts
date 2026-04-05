import { API_ROUTES } from '../constants'
import { extractGmailMessageContent } from '../helper/gmail-helper'
import { getValidGmailAccessTokenByCredentialId } from '../lib/credentials'
import { TNodeExecutionResult } from '../types/workflow.types'

// Helper to fetch file content from URL
async function fetchAttachmentContent(
  source: string
): Promise<{ data: string; filename: string; mimeType: string } | null> {
  try {
    // Check if it's a URL
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const response = await fetch(source)
      if (!response.ok) return null

      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const mimeType =
        response.headers.get('content-type') || 'application/octet-stream'

      // Extract filename from URL
      const urlPath = new URL(source).pathname
      const filename = urlPath.split('/').pop() || 'attachment'

      return { data: base64, filename, mimeType }
    }

    return null
  } catch {
    return null
  }
}

function parseDataUrl(
  value: string
): { mimeType: string; data: string } | null {
  const normalized = value.trim()
  if (!normalized.startsWith('data:')) return null
  const match = normalized.match(/^data:([^;]+);base64,([\s\S]+)$/i)
  if (!match) return null
  return { mimeType: match[1], data: match[2].replace(/\s/g, '') }
}

type AttachmentSource = {
  value: string
  mimeType?: string
  filename?: string
  type?: 'url' | 'base64' | 'data' | 'dataurl' | 'text'
}

function normalizeMimeTypeCandidate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const lowered = trimmed.toLowerCase()
  if (lowered === 'text') return 'text/plain'
  if (lowered === 'base64' || lowered === 'binary' || lowered === 'url') {
    return undefined
  }

  return trimmed
}

function normalizeAttachmentTypeCandidate(
  value: unknown
): AttachmentSource['type'] | undefined {
  if (typeof value !== 'string') return undefined
  const lowered = value.trim().toLowerCase()

  if (lowered === 'binary') return 'base64'

  if (
    lowered === 'url' ||
    lowered === 'base64' ||
    lowered === 'data' ||
    lowered === 'dataurl' ||
    lowered === 'text'
  ) {
    return lowered
  }

  return undefined
}

function isLikelyBase64Payload(value: string): boolean {
  const cleaned = value.replace(/\s/g, '')
  if (!cleaned) return false

  // Avoid treating short plain-text values (e.g. "test") as base64.
  if (cleaned.length < 32) return false
  if (cleaned.length % 4 !== 0) return false
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) return false

  try {
    const decoded = Buffer.from(cleaned, 'base64')
    if (!decoded.length) return false
    const reEncoded = decoded.toString('base64').replace(/=+$/g, '')
    return reEncoded === cleaned.replace(/=+$/g, '')
  } catch {
    return false
  }
}

function toAttachmentSource(item: unknown): AttachmentSource | null {
  if (typeof item === 'string') {
    const value = item.trim()
    return value ? { value } : null
  }

  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const valueCandidate = [
    record.data,
    record.content,
    record.value,
    record.url
  ].find((candidate) => typeof candidate === 'string' && candidate.trim())

  if (typeof valueCandidate !== 'string') {
    return null
  }

  const mimeType =
    normalizeMimeTypeCandidate(record.mimeType) ||
    normalizeMimeTypeCandidate(record.contentType) ||
    normalizeMimeTypeCandidate(record.content_type) ||
    normalizeMimeTypeCandidate(record.mimetype)

  const filename =
    typeof record.filename === 'string' && record.filename.trim()
      ? record.filename.trim()
      : typeof record.name === 'string' && record.name.trim()
        ? record.name.trim()
        : typeof record.fileName === 'string' && record.fileName.trim()
          ? record.fileName.trim()
          : undefined

  const type =
    normalizeAttachmentTypeCandidate(record.type) ||
    normalizeAttachmentTypeCandidate(record.contentType)

  return {
    value: valueCandidate.trim(),
    mimeType,
    filename,
    type
  }
}

function getSourcesFromRecord(
  record: Record<string, unknown>
): AttachmentSource[] {
  const direct = toAttachmentSource(record)
  if (direct) return [direct]

  const collectionKeys = ['attachments', 'files', 'items'] as const

  for (const key of collectionKeys) {
    const candidate = record[key]
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => toAttachmentSource(item))
        .filter(Boolean) as AttachmentSource[]
    }
  }

  if (record.data && typeof record.data === 'object') {
    const nestedSources = getSourcesFromRecord(
      record.data as Record<string, unknown>
    )
    if (nestedSources.length > 0) return nestedSources
  }

  return []
}

function parseAttachmentSources(
  attachments: unknown,
  attachmentType?: string
): AttachmentSource[] {
  if (!attachments) return []

  if (Array.isArray(attachments)) {
    return attachments
      .map((item) => toAttachmentSource(item))
      .filter(Boolean) as AttachmentSource[]
  }

  if (typeof attachments === 'object') {
    const direct = toAttachmentSource(attachments)
    if (direct) return [direct]

    const record = attachments as Record<string, unknown>
    return getSourcesFromRecord(record)
  }

  if (typeof attachments !== 'string') return []

  const raw = attachments.trim()
  if (!raw) return []

  // Allow JSON payloads (single object or array) from previous node outputs.
  if (
    (raw.startsWith('[') && raw.endsWith(']')) ||
    (raw.startsWith('{') && raw.endsWith('}'))
  ) {
    try {
      const parsed = JSON.parse(raw)

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => toAttachmentSource(item))
          .filter(Boolean) as AttachmentSource[]
      }

      if (parsed && typeof parsed === 'object') {
        const direct = toAttachmentSource(parsed)
        if (direct) return [direct]

        const parsedRecord = parsed as Record<string, unknown>
        const extracted = getSourcesFromRecord(parsedRecord)
        if (extracted.length > 0) return extracted
      }
    } catch {
      // Ignore JSON parse errors and fallback below.
    }
  }

  // Preserve data URLs (single or multiple) without splitting at the base64 comma.
  const dataUrlMatches = Array.from(raw.matchAll(/data:[^;,\s]+;base64,/g))
  if (dataUrlMatches.length > 0) {
    return dataUrlMatches
      .map((match, index) => {
        const start = match.index ?? 0
        const end =
          index + 1 < dataUrlMatches.length
            ? (dataUrlMatches[index + 1].index ?? raw.length)
            : raw.length

        return raw
          .slice(start, end)
          .trim()
          .replace(/^[,\s]+|[,\s]+$/g, '')
      })
      .filter(Boolean)
      .map((value) => ({ value, type: 'base64' as const }))
  }

  if (attachmentType === 'base64') {
    // In base64 mode, preserve raw payload as a single source.
    // This avoids corrupting text payloads (e.g. CSV) by splitting on commas.
    return [{ value: raw, type: 'base64' }]
  }

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((value) => ({ value }))
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

  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  ) {
    return 'image/png'
  }

  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8) {
    return 'image/jpeg'
  }

  if (
    header.length >= 4 &&
    header[0] === 0x47 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x38
  ) {
    return 'image/gif'
  }

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

    // Check for specific folder markers
    const hasXlWorkbook = contentStr.includes('xl/workbook')
    const hasXlSharedStrings = contentStr.includes('xl/sharedStrings')
    const hasXlStyles = contentStr.includes('xl/styles')
    const hasXlSlash = contentStr.includes('xl/')

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

    // Generic Office Open XML
    if (
      contentStr.includes('[Content_Types].xml') ||
      contentStr.includes('Content_Types')
    ) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    return null
  }

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

// Build MIME multipart email with attachments
function buildMimeEmail(params: {
  to: string
  cc?: string
  bcc?: string
  subject: string
  body: string
  attachments: { data: string; filename: string; mimeType: string }[]
}): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const lines: string[] = []

  const chunkBase64 = (data: string, size = 76) =>
    data.match(new RegExp(`.{1,${size}}`, 'g'))?.join('\r\n') || data

  // Headers
  lines.push(`To: ${params.to}`)
  if (params.cc) lines.push(`Cc: ${params.cc}`)
  if (params.bcc) lines.push(`Bcc: ${params.bcc}`)
  lines.push(`Subject: ${params.subject}`)
  lines.push('MIME-Version: 1.0')
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
  lines.push('')

  // Body part
  lines.push(`--${boundary}`)
  lines.push('Content-Type: text/plain; charset=utf-8')
  lines.push('')
  lines.push(params.body)
  lines.push('')

  // Attachment parts
  for (const att of params.attachments) {
    lines.push(`--${boundary}`)
    lines.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`)
    lines.push('Content-Transfer-Encoding: base64')
    lines.push(`Content-Disposition: attachment; filename="${att.filename}"`)
    lines.push('')
    lines.push(chunkBase64(att.data))
    lines.push('')
  }

  lines.push(`--${boundary}--`)

  return lines.join('\r\n')
}

export const executeSendEmail = async (
  config: any
): Promise<TNodeExecutionResult> => {
  try {
    const {
      to,
      cc,
      bcc,
      subject,
      body,
      attachments,
      credentialId,
      attachmentType,
      attachmentFilename
    } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    if (!to) {
      return { success: false, error: 'Missing recipient email address' }
    }

    // Get valid Gmail access token
    const { token } = await getValidGmailAccessTokenByCredentialId(credentialId)

    let rawEmail: string

    // Parse attachments if provided
    const attachmentSources = parseAttachmentSources(
      attachments,
      attachmentType
    )

    if (attachmentSources.length > 0) {
      const fetchedAttachments: {
        data: string
        filename: string
        mimeType: string
      }[] = []

      const isUrl = (value: string) =>
        value.startsWith('http://') || value.startsWith('https://')

      if (attachmentType === 'base64') {
        for (const source of attachmentSources) {
          const rawValue = source.value.trim()
          const parsed = parseDataUrl(rawValue)

          let data: string
          let mimeType: string

          if (parsed) {
            data = parsed.data
            mimeType =
              source.mimeType ||
              parsed.mimeType ||
              detectMimeTypeFromBase64(parsed.data) ||
              'application/octet-stream'
          } else if (source.type === 'text') {
            data = Buffer.from(rawValue, 'utf-8').toString('base64')
            mimeType = source.mimeType || 'text/plain'
          } else {
            const looksLikeBase64 =
              source.type === 'base64' || isLikelyBase64Payload(rawValue)

            if (looksLikeBase64) {
              data = rawValue.replace(/\s/g, '')
              mimeType =
                source.mimeType ||
                detectMimeTypeFromBase64(data) ||
                'application/octet-stream'
            } else {
              data = Buffer.from(rawValue, 'utf-8').toString('base64')
              mimeType = source.mimeType || 'text/plain'
            }
          }

          const filename = ensureFilenameExtension(
            source.filename || attachmentFilename || 'attachment',
            mimeType
          )

          fetchedAttachments.push({
            data,
            filename,
            mimeType
          })
        }
      } else {
        for (const source of attachmentSources) {
          const rawValue = source.value.trim()
          const parsed = parseDataUrl(rawValue)
          const treatAsInlineData =
            !!parsed ||
            source.type === 'base64' ||
            source.type === 'data' ||
            source.type === 'dataurl' ||
            source.type === 'text'

          if (treatAsInlineData) {
            let data: string
            let mimeType: string

            if (parsed) {
              data = parsed.data
              mimeType =
                source.mimeType ||
                parsed.mimeType ||
                detectMimeTypeFromBase64(parsed.data) ||
                'application/octet-stream'
            } else if (source.type === 'text') {
              data = Buffer.from(rawValue, 'utf-8').toString('base64')
              mimeType = source.mimeType || 'text/plain'
            } else {
              const looksLikeBase64 =
                source.type === 'base64' || isLikelyBase64Payload(rawValue)

              if (looksLikeBase64) {
                data = rawValue.replace(/\s/g, '')
                mimeType =
                  source.mimeType ||
                  detectMimeTypeFromBase64(data) ||
                  'application/octet-stream'
              } else {
                data = Buffer.from(rawValue, 'utf-8').toString('base64')
                mimeType = source.mimeType || 'text/plain'
              }
            }

            const filename = ensureFilenameExtension(
              source.filename || attachmentFilename || 'attachment',
              mimeType
            )

            fetchedAttachments.push({
              data,
              filename,
              mimeType
            })
            continue
          }

          if (!isUrl(rawValue)) continue
          const att = await fetchAttachmentContent(rawValue)
          if (att) fetchedAttachments.push(att)
        }
      }

      if (fetchedAttachments.length === 0) {
        return {
          success: false,
          error:
            attachmentType === 'base64'
              ? 'Unable to parse base64 attachments.'
              : 'Unable to fetch attachments. Check URLs and access permissions.'
        }
      }

      rawEmail = buildMimeEmail({
        to,
        cc,
        bcc,
        subject: subject || '(No Subject)',
        body: body || '',
        attachments: fetchedAttachments
      })
    } else {
      // Simple email without attachments
      const emailLines = [`To: ${to}`]
      if (cc) emailLines.push(`Cc: ${cc}`)
      if (bcc) emailLines.push(`Bcc: ${bcc}`)
      emailLines.push(`Subject: ${subject || '(No Subject)'}`)
      emailLines.push('Content-Type: text/plain; charset=utf-8')
      emailLines.push('')
      emailLines.push(body || '')

      rawEmail = emailLines.join('\r\n')
    }

    // Encode for Gmail API
    const encodedEmail = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    // Send via Gmail API
    const sendRes = await fetch(API_ROUTES.GMAIL.SEND_MESSAGE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedEmail })
    })

    if (!sendRes.ok) {
      const err = await sendRes.json()
      return {
        success: false,
        error: err?.error?.message || 'Failed to send email'
      }
    }

    const result = await sendRes.json()

    return {
      success: true,
      data: {
        messageId: result.id,
        threadId: result.threadId,
        labelIds: result.labelIds || [],
        to,
        cc: cc || null,
        bcc: bcc || null,
        subject: subject || '(No Subject)',
        body: body || '',
        attachmentCount: attachmentSources.length
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

export const executeReadEmail = async (
  config: any
): Promise<TNodeExecutionResult> => {
  try {
    const {
      credentialId,
      maxResults = 10,
      labelId,
      markAsRead = false,
      includeBody = true,
      includeAttachments = false,
      from,
      to,
      subject,
      after,
      before,
      hasAttachment = false,
      isUnread = false
    } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    // Get valid Gmail access token
    const { token } = await getValidGmailAccessTokenByCredentialId(credentialId)

    // Build query string for Gmail search
    const queryParts: string[] = []
    if (from) queryParts.push(`from:${from}`)
    if (to) queryParts.push(`to:${to}`)
    if (subject) queryParts.push(`subject:${subject}`)
    if (after) queryParts.push(`after:${after}`)
    if (before) queryParts.push(`before:${before}`)
    if (hasAttachment) queryParts.push('has:attachment')
    if (isUnread) queryParts.push('is:unread')

    // Build request URL with query parameters
    const params = new URLSearchParams()
    params.set('maxResults', String(maxResults))
    if (labelId) params.set('labelIds', labelId)
    if (queryParts.length > 0) params.set('q', queryParts.join(' '))

    const listUrl = `${API_ROUTES.GMAIL.GET_MESSAGES}?${params.toString()}`

    // Fetch message list
    const messageListRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!messageListRes.ok) {
      const err = await messageListRes.json()
      return {
        success: false,
        error: err?.error?.message || 'Failed to fetch emails'
      }
    }

    const messageList = await messageListRes.json()

    if (!messageList?.messages?.length) {
      return { success: true, data: { emails: [], count: 0 } }
    }

    // Fetch full details for each message
    const emails = await Promise.all(
      messageList.messages.slice(0, maxResults).map(async (msg: any) => {
        const res = await fetch(API_ROUTES.GMAIL.GET_MESSAGE(msg.id), {
          headers: { Authorization: `Bearer ${token}` }
        })
        const message = await res.json()

        const headers = message.payload?.headers || []
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
            ?.value || ''

        // Extract body and attachments based on config
        let body: string | undefined
        let attachments: {
          filename: string
          mimeType: string
          data: string
        }[] = []
        let attachmentCount = 0

        if (includeBody || includeAttachments) {
          const content = await extractGmailMessageContent(
            message.id,
            message.payload,
            token
          )

          if (includeBody) {
            body = content.body
          }

          if (includeAttachments) {
            attachments = content.attachments
          }

          attachmentCount = content.attachments.length
        }

        // Mark as read if requested
        if (markAsRead) {
          try {
            await fetch(API_ROUTES.GMAIL.MODIFY_MESSAGE(message.id), {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                removeLabelIds: ['UNREAD']
              })
            })
          } catch {
            // Silently fail - don't break the read operation
          }
        }

        return {
          id: message.id,
          threadId: message.threadId,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          to: getHeader('To'),
          date: getHeader('Date'),
          snippet: message.snippet,
          ...(includeBody && { body }),
          ...(includeAttachments && { attachments }),
          attachmentCount
        }
      })
    )

    return {
      success: true,
      data: {
        emails,
        count: emails.length,
        folder: labelId || 'all'
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to read emails' }
  }
}

export const executeDeleteEmail = async (
  config: any
): Promise<TNodeExecutionResult> => {
  try {
    const { credentialId, messageId } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    if (!messageId) {
      return { success: false, error: 'Missing message ID' }
    }

    const { token } = await getValidGmailAccessTokenByCredentialId(credentialId)

    const trashRes = await fetch(API_ROUTES.GMAIL.MODIFY_MESSAGE(messageId), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        addLabelIds: ['TRASH'],
        removeLabelIds: ['INBOX']
      })
    })

    if (!trashRes.ok) {
      const err = await trashRes.json().catch(() => null)
      return {
        success: false,
        error: err?.error?.message || 'Failed to move email to trash'
      }
    }

    return {
      success: true,
      data: {
        messageId,
        trashed: true
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to move email to trash'
    }
  }
}
