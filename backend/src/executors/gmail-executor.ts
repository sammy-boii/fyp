import { API_ROUTES } from '../constants'
import { extractGmailMessageContent } from '../helper/gmail-helper'
import {
  getValidGmailAccessTokenByCredentialId,
  getValidGoogleDriveAccessTokenByCredentialId
} from '../lib/credentials'
import { TNodeExecutionResult } from '../types/workflow.types'

// Helper to fetch file content from URL or Google Drive
async function fetchAttachmentContent(
  source: string,
  driveToken: string
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

    // Assume it's a Google Drive file ID
    const metaRes = await fetch(
      API_ROUTES.GOOGLE_DRIVE.GET_FILE(source) + '?fields=name,mimeType',
      {
        headers: { Authorization: `Bearer ${driveToken}` }
      }
    )

    if (!metaRes.ok) return null

    const meta = await metaRes.json()

    console.log('NOT WORKING:::', driveToken)

    const contentRes = await fetch(
      API_ROUTES.GOOGLE_DRIVE.GET_FILE_CONTENT(source),
      {
        headers: { Authorization: `Bearer ${driveToken}` }
      }
    )

    if (!contentRes.ok) return null

    const buffer = await contentRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return {
      data: base64,
      filename: meta.name || 'attachment',
      mimeType: meta.mimeType || 'application/octet-stream'
    }
  } catch {
    return null
  }
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
      driveCredentialId
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

    const isUrl = (value: string) =>
      value.startsWith('http://') || value.startsWith('https://')

    const driveAttachmentSources = attachmentSources.filter(
      (s: string) => !isUrl(s)
    )

    if (driveAttachmentSources.length > 0 && !driveCredentialId) {
      return {
        success: false,
        error:
          'Drive attachment detected. Please select a Google Drive credential.'
      }
    }

    if (attachmentSources.length > 0) {
      // Fetch all attachments
      const fetchedAttachments: {
        data: string
        filename: string
        mimeType: string
      }[] = []

      const driveToken = driveCredentialId
        ? (
            await getValidGoogleDriveAccessTokenByCredentialId(
              driveCredentialId
            )
          ).token
        : token

      for (const source of attachmentSources) {
        const att = await fetchAttachmentContent(source, driveToken)
        if (att) fetchedAttachments.push(att)
      }

      if (fetchedAttachments.length === 0) {
        return {
          success: false,
          error:
            'Unable to fetch attachments. Check URLs/Drive file IDs and access permissions.'
        }
      }

      // Build MIME multipart email
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
