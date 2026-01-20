import { API_ROUTES } from '../constants'
import { extractGmailMessageContent } from '../helper/gmail-helper'
import { getValidGmailAccessTokenByCredentialId } from '../lib/credentials'
import { TNodeExecutionResult } from '../types/workflow.types'

export const executeSendEmail = async (
  config: any
): Promise<TNodeExecutionResult> => {
  console.log(
    '[executeSendEmail] Starting with config:',
    JSON.stringify(config, null, 2)
  )

  try {
    const { to, subject, body, credentialId } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    if (!to) {
      return { success: false, error: 'Missing recipient email address' }
    }

    // Get valid Gmail access token
    const { token } = await getValidGmailAccessTokenByCredentialId(credentialId)

    // Build email content
    const email = [
      `To: ${to}`,
      `Subject: ${subject || '(No Subject)'}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body || ''
    ].join('\r\n')

    // Encode for Gmail API
    const encodedEmail = Buffer.from(email)
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
      console.error('[executeSendEmail] Gmail API Error:', err)
      return {
        success: false,
        error: err?.error?.message || 'Failed to send email'
      }
    }

    const result = await sendRes.json()
    console.log('[executeSendEmail] Success:', result.id)

    return {
      success: true,
      data: {
        messageId: result.id,
        to,
        subject,
        message: 'Email sent successfully'
      }
    }
  } catch (error: any) {
    console.error('[executeSendEmail] Exception:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

export const executeReadEmail = async (
  config: any
): Promise<TNodeExecutionResult> => {
  console.log(
    '[executeReadEmail] Starting with config:',
    JSON.stringify(config, null, 2)
  )

  try {
    const {
      credentialId,
      maxResults = 10,
      from,
      to,
      subject,
      after,
      before,
      hasAttachment,
      isUnread,
      labelId
    } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    // Get valid Gmail access token
    const { token } = await getValidGmailAccessTokenByCredentialId(credentialId)

    // Build Gmail search query
    const queryParts: string[] = []
    if (from) queryParts.push(`from:${from}`)
    if (to) queryParts.push(`to:${to}`)
    if (subject) queryParts.push(`subject:${subject}`)
    if (after) queryParts.push(`after:${after.replace(/-/g, '/')}`)
    if (before) queryParts.push(`before:${before.replace(/-/g, '/')}`)
    if (hasAttachment) queryParts.push('has:attachment')
    if (isUnread) queryParts.push('is:unread')

    const searchQuery = queryParts.join(' ')

    // Build request URL with query parameters
    const params = new URLSearchParams()
    params.set('maxResults', String(maxResults))
    if (searchQuery) params.set('q', searchQuery)
    if (labelId) params.set('labelIds', labelId)

    const listUrl = `${API_ROUTES.GMAIL.GET_MESSAGES}?${params.toString()}`

    // Fetch message list
    const messageListRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!messageListRes.ok) {
      const err = await messageListRes.json()
      console.error('[executeReadEmail] List messages failed:', err)
      return {
        success: false,
        error: err?.error?.message || 'Failed to fetch emails'
      }
    }

    const messageList = await messageListRes.json()
    console.log(
      `[executeReadEmail] Found ${messageList?.messages?.length || 0} messages`
    )

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

        const { body, attachments } = await extractGmailMessageContent(
          message.id,
          message.payload,
          token
        )

        const headers = message.payload?.headers || []
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
            ?.value || ''

        return {
          id: message.id,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          to: getHeader('To'),
          date: getHeader('Date'),
          snippet: message.snippet,
          body,
          attachmentCount: attachments.length
        }
      })
    )

    console.log('[executeReadEmail] Successfully processed messages')

    return {
      success: true,
      data: {
        emails,
        count: emails.length,
        query: searchQuery || 'all'
      }
    }
  } catch (error: any) {
    console.error('[executeReadEmail] Exception:', error)
    return { success: false, error: error.message || 'Failed to read emails' }
  }
}
