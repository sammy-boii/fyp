import { prisma } from '@shared/db/prisma'
import { encryptToken } from './crypto'
import { API_ROUTES } from '@/src/constants'

async function getGmailCredential(userId: string) {
  try {
    return await prisma.oAuthCredential.findFirst({
      where: {
        userId,
        provider: 'google',
        service: 'gmail'
      }
    })
  } catch (err) {
    return null
  }
}

async function getGoogleDriveCredential(userId: string) {
  return await prisma.oAuthCredential.findFirst({
    where: {
      userId,
      provider: 'google',
      service: 'drive'
    }
  })
}

async function refreshGoogleAccessToken(
  credentialId: string,
  refreshToken: string,
  provider: string
) {
  try {
    let client_id, client_secret

    if (provider == 'gmail') {
      client_id = Bun.env.GMAIL_CLIENT_ID as string
      client_secret = Bun.env.GMAIL_CLIENT_SECRET as string
    } else {
      client_id = Bun.env.GOOGLE_DRIVE_CLIENT_SECRET as string
      client_secret = Bun.env.GOOGLE_DRIVE_CLIENT_ID as string
    }

    const response = await fetch(API_ROUTES.OAUTH.REFRESH_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id,
        client_secret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }).toString()
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()

    // Update the credential in database with new access token and expiry
    const encryptedAccessToken = encryptToken(data.access_token)
    const expiresInSeconds = data.expires_in || 3600 // Default 1 hour
    const newExpiryDate = new Date(Date.now() + expiresInSeconds * 1000)

    const updatedCredential = await prisma.oAuthCredential.update({
      where: { id: credentialId },
      data: {
        accessToken: encryptedAccessToken,
        accessTokenExpiresAt: newExpiryDate
      }
    })

    return updatedCredential
  } catch (error) {
    throw error
  }
}

/**
 * Get a valid decrypted access token for Gmail, refreshing if expired
 */
export async function getValidGmailAccessToken(
  userId: string,
  provider = 'gmail'
): Promise<{ token: string; credential: any }> {
  const credential = await getGmailCredential(userId)

  if (!credential) {
    throw new Error('Gmail credential not found')
  }

  return await validateAndRefreshToken(credential, provider)
}

/**
 * Get a valid decrypted access token by credentialId, refreshing if expired
 */
export async function getValidGmailAccessTokenByCredentialId(
  credentialId: string,
  provider: string
): Promise<{ token: string; credential: any }> {
  const credential = await prisma.oAuthCredential.findUnique({
    where: { id: credentialId }
  })

  if (!credential) {
    throw new Error('Credential not found')
  }

  return await validateAndRefreshToken(credential, provider)
}

/**
 * Validate and refresh token if needed
 */
async function validateAndRefreshToken(
  credential: any,
  provider: string
): Promise<{ token: string; credential: any }> {
  // Check if token is expired
  if (
    credential.accessTokenExpiresAt &&
    new Date() >= credential.accessTokenExpiresAt
  ) {
    // Token is expired, refresh it
    if (!credential.refreshToken) {
      throw new Error(
        'Refresh token not available. Please reconnect your Google account.'
      )
    }

    // Decrypt refresh token to use it
    const { decryptToken } = await import('./crypto')
    const decryptedRefreshToken = decryptToken(credential.refreshToken)

    // Refresh the access token
    const updatedCredential = await refreshGoogleAccessToken(
      credential.id,
      decryptedRefreshToken,
      provider
    )

    // Decrypt and return the new token
    const { decryptToken: decrypt } = await import('./crypto')
    const decryptedAccessToken = decrypt(updatedCredential.accessToken)
    return { token: decryptedAccessToken, credential: updatedCredential }
  }

  // Token is still valid, just decrypt and return it
  const { decryptToken } = await import('./crypto')
  const decryptedAccessToken = decryptToken(credential.accessToken)
  return { token: decryptedAccessToken, credential }
}

/**
 * Get a valid decrypted access token for Google Drive by credentialId, refreshing if expired
 */
export async function getValidGoogleDriveAccessTokenByCredentialId(
  credentialId: string,
  provider = 'drive'
): Promise<{ token: string; credential: any }> {
  const credential = await prisma.oAuthCredential.findUnique({
    where: { id: credentialId }
  })

  if (!credential) {
    throw new Error('Google Drive credential not found')
  }

  return await validateAndRefreshToken(credential, provider)
}

/**
 * Get Discord bot token from credential
 * Discord bot tokens don't expire, so we just return the token
 */
export async function getDiscordBotToken(
  credentialId: string
): Promise<string> {
  // Verify the credential exists and belongs to a valid user
  const credential = await prisma.oAuthCredential.findUnique({
    where: { id: credentialId }
  })

  if (!credential) {
    throw new Error('Discord credential not found')
  }

  if (credential.provider !== 'discord') {
    throw new Error('Invalid credential type - expected Discord credential')
  }

  // Use the shared bot token from environment variable
  const botToken = Bun.env.DISCORD_BOT_TOKEN

  if (!botToken) {
    throw new Error('Discord bot token not configured on server')
  }

  return botToken
}
