import { API_ROUTES } from '@/src/constants'
import { prisma } from '@shared/db/prisma'

const GMAIL_PUBSUB_TOPIC = Bun.env.GMAIL_PUBSUB_TOPIC!

export interface GmailWatchResponse {
  historyId: string
  expiration: string // Unix timestamp in milliseconds
}

/**
 * Set up Gmail push notification watch for a user
 */
export async function setupGmailWatch(
  accessToken: string,
  credentialId: string,
  providerEmail: string
): Promise<GmailWatchResponse> {
  const response = await fetch(API_ROUTES.GMAIL.WATCH, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      topicName: GMAIL_PUBSUB_TOPIC,
      labelIds: ['INBOX'] // Watch inbox only
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.error?.message || 'Failed to set up Gmail watch')
  }

  const watchData: GmailWatchResponse = await response.json()

  // Store watch data in credential
  await prisma.oAuthCredential.update({
    where: { id: credentialId },
    data: {
      providerEmail,
      gmailHistoryId: watchData.historyId,
      gmailWatchExpiration: new Date(parseInt(watchData.expiration))
    }
  })

  console.log(
    `Gmail watch set up for ${providerEmail}, expires: ${new Date(parseInt(watchData.expiration))}`
  )

  return watchData
}

/**
 * Stop Gmail push notification watch for a user
 */
export async function stopGmailWatch(accessToken: string): Promise<void> {
  const response = await fetch(API_ROUTES.GMAIL.STOP_WATCH, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.error?.message || 'Failed to stop Gmail watch')
  }
}

/**
 * Get new messages since a history ID
 */
export async function getNewMessages(
  accessToken: string,
  startHistoryId: string
): Promise<{ messages: string[]; newHistoryId: string }> {
  const response = await fetch(API_ROUTES.GMAIL.HISTORY_LIST(startHistoryId), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    // 404 means history ID is too old
    if (response.status === 404) {
      return { messages: [], newHistoryId: startHistoryId }
    }
    const error = await response.json()
    throw new Error(error?.error?.message || 'Failed to fetch history')
  }

  const data = await response.json()

  // Extract message IDs from history
  const messageIds = new Set<string>()
  if (data.history) {
    for (const historyItem of data.history) {
      if (historyItem.messagesAdded) {
        for (const added of historyItem.messagesAdded) {
          messageIds.add(added.message.id)
        }
      }
    }
  }

  return {
    messages: Array.from(messageIds),
    newHistoryId: data.historyId || startHistoryId
  }
}

/**
 * Fetch full message details
 */
export async function getFullMessage(
  accessToken: string,
  messageId: string
): Promise<any> {
  const response = await fetch(API_ROUTES.GMAIL.GET_MESSAGE(messageId), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch message')
  }

  return response.json()
}
