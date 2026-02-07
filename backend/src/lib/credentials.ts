import { prisma } from '@shared/db/prisma'
import { encryptToken } from './crypto'
import { API_ROUTES } from '@/src/constants'

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

// for google services

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

export async function getValidGmailAccessTokenByCredentialId(
  credentialId: string
): Promise<{ token: string; credential: any }> {
  const credential = await prisma.oAuthCredential.findUnique({
    where: { id: credentialId }
  })

  if (!credential) {
    throw new Error('Credential not found')
  }

  return await validateAndRefreshToken(credential, 'gmail')
}

export async function getValidGoogleDriveAccessTokenByCredentialId(
  credentialId: string
): Promise<{ token: string; credential: any }> {
  const credential = await prisma.oAuthCredential.findUnique({
    where: { id: credentialId }
  })

  if (!credential) {
    throw new Error('Google Drive credential not found')
  }

  return await validateAndRefreshToken(credential, 'drive')
}

// bot tokens don't expire

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
