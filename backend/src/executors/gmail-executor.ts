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

  if (
    header.length >= 4 &&
    header[0] === 0x50 &&
    header[1] === 0x4b &&
    header[2] === 0x03 &&
    header[3] === 0x04
  ) {
    return 'application/zip'
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
    const attachmentSources = attachments
      ? attachments
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : []

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
          const parsed = parseDataUrl(source)
          const mimeType =
            parsed?.mimeType ||
            detectMimeTypeFromBase64(source) ||
            'application/octet-stream'
          const filename = ensureFilenameExtension(
            attachmentFilename || 'attachment',
            mimeType
          )
          const data = parsed?.data || source
          fetchedAttachments.push({
            data,
            filename,
            mimeType
          })
        }
      } else {
        for (const source of attachmentSources) {
          if (!isUrl(source)) continue
          const att = await fetchAttachmentContent(source)
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
