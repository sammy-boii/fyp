import { API_ROUTES } from '@/src/constants'
import { extractGmailMessageContent } from '@/src/helper/gmail-helper'
import { tryCatch } from '@/src/lib/utils'
import { getValidGmailAccessToken } from '@/src/lib/credentials'
import { AppError } from '@/src/types'
import { Context } from 'hono'

export const getEmails = tryCatch(async (c: Context) => {
  const user = c.get('user')

  if (!user) {
    throw new AppError('User not found', 401)
  }

  // Get valid access token (handles refresh if expired)
  const { token } = await getValidGmailAccessToken(user.id)

  const messageListRes = await fetch(`${API_ROUTES.GMAIL.GET_MESSAGES}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!messageListRes.ok) {
    const err = await messageListRes.json()
    throw new AppError(
      err?.error?.message || JSON.stringify(err.error),
      400,
      err.error
    )
  }

  const messageList = await messageListRes.json()

  const messages = await Promise.all(
    (messageList?.messages || []).map(async (msg: any) => {
      const res = await fetch(API_ROUTES.GMAIL.GET_MESSAGE(msg.id), {
        headers: { Authorization: `Bearer ${token}` }
      })
      const message = await res.json()

      // Recursive extraction, including attachments
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
        date: getHeader('Date'),
        body,
        attachments
      }
    })
  )

  return messages
})

export const sendEmail = tryCatch(async (c: Context) => {
  const user = c.get('user')

  if (!user) {
    throw new AppError('User not found', 401)
  }

  const body = await c.req.json()
  const { to, subject, body: emailBody } = body

  if (!to || !subject || !emailBody) {
    throw new AppError('Missing required fields: to, subject, body', 400)
  }

  // Get valid access token (handles refresh if expired)
  const { token } = await getValidGmailAccessToken(user.id)

  // Create RFC 5322 formatted email
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    emailBody
  ].join('\r\n')

  // Encode to base64url
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const sendRes = await fetch(`${API_ROUTES.GMAIL.SEND_MESSAGE}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedEmail
    })
  })

  if (!sendRes.ok) {
    const err = await sendRes.json()
    throw new AppError(
      err?.error?.message || 'Failed to send email',
      400,
      err.error
    )
  }

  const result = await sendRes.json()

  return {
    success: true,
    messageId: result.id,
    message: 'Email sent successfully'
  }
})
