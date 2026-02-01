import { Hono } from 'hono'
import { prisma } from '@shared/db/prisma'
import { getNewMessages, getFullMessage } from '@/src/helper/gmail-watch'
import { getValidGmailAccessTokenByCredentialId } from '@/src/lib/credentials'
import { extractGmailMessageContent } from '@/src/helper/gmail-helper'

export const webhookGmailRoutes = new Hono()

interface PubSubMessage {
  message: {
    data: string // Base64 encoded
    messageId: string
    publishTime: string
  }
  subscription: string
}

interface GmailNotification {
  emailAddress: string
  historyId: string
}

// Track processed message IDs to handle duplicates (in production, use Redis/DB)
const processedNotifications = new Set<string>()

webhookGmailRoutes.post('/', async (c) => {
  // Acknowledge immediately to prevent Pub/Sub retries

  try {
    const body: PubSubMessage = await c.req.json()
    console.log('📬 Gmail Pub/Sub notification received')

    // Check for duplicate
    if (processedNotifications.has(body.message.messageId)) {
      console.log('Duplicate notification, skipping')
      return c.text('OK', 200)
    }
    processedNotifications.add(body.message.messageId)

    // Clean up old entries (keep last 1000)
    if (processedNotifications.size > 1000) {
      const entries = Array.from(processedNotifications)
      entries.slice(0, 500).forEach((id) => processedNotifications.delete(id))
    }

    // Decode the base64 message data
    const decodedData = Buffer.from(body.message.data, 'base64').toString(
      'utf-8'
    )
    const notification: GmailNotification = JSON.parse(decodedData)

    console.log('📧 Notification for:', notification.emailAddress)
    console.log('📜 New History ID:', notification.historyId)

    // Find the credential by provider email
    const credential = await prisma.oAuthCredential.findFirst({
      where: {
        providerEmail: notification.emailAddress,
        provider: 'google',
        service: 'gmail'
      }
    })

    if (!credential) {
      console.log('No credential found for', notification.emailAddress)
      return c.text('OK', 200)
    }

    if (!credential.gmailHistoryId) {
      console.log('No history ID stored, skipping')
      return c.text('OK', 200)
    }

    // Get valid access token (will refresh if expired)
    const { token } = await getValidGmailAccessTokenByCredentialId(
      credential.id
    )

    // Get new messages since last known history ID
    const { messages: messageIds, newHistoryId } = await getNewMessages(
      token,
      credential.gmailHistoryId
    )

    console.log(`📨 Found ${messageIds.length} new message(s)`)

    // Update stored history ID
    await prisma.oAuthCredential.update({
      where: { id: credential.id },
      data: { gmailHistoryId: newHistoryId }
    })

    // Fetch and log each new message
    for (const messageId of messageIds) {
      try {
        const message = await getFullMessage(token, messageId)

        const headers = message.payload?.headers || []
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
            ?.value || ''

        const { body } = await extractGmailMessageContent(
          messageId,
          message.payload,
          token
        )

        const emailData = {
          id: message.id,
          threadId: message.threadId,
          from: getHeader('From'),
          to: getHeader('To'),
          subject: getHeader('Subject'),
          date: getHeader('Date'),
          snippet: message.snippet,
          body: body.substring(0, 500) // Log first 500 chars
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📧 NEW EMAIL RECEIVED:')
        console.log('From:', emailData.from)
        console.log('To:', emailData.to)
        console.log('Subject:', emailData.subject)
        console.log('Date:', emailData.date)
        console.log('Snippet:', emailData.snippet)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // TODO: Trigger workflows that have Gmail trigger configured
        // await triggerGmailWorkflows(credential.userId, emailData)
      } catch (err) {
        console.error('Error processing message:', messageId, err)
      }
    }

    return c.text('OK', 200)
  } catch (error) {
    console.error('Webhook error:', error)
    // Still return 200 to prevent Pub/Sub retries for malformed data
    return c.text('OK', 200)
  }
})
