import { prisma } from '@shared/db/prisma'

/**
 * Get Gmail credential for a user
 */
export async function getGmailCredential(userId: string) {
  return await prisma.oAuthCredential.findFirst({
    where: {
      userId,
      provider: 'google',
      service: 'gmail'
    }
  })
}

/**
 * Get Google Drive credential for a user
 */
export async function getGoogleDriveCredential(userId: string) {
  return await prisma.oAuthCredential.findFirst({
    where: {
      userId,
      provider: 'google',
      service: 'drive'
    }
  })
}

/**
 * Get credential by provider and service
 */
export async function getCredential(
  userId: string,
  provider: string,
  service?: string
) {
  return await prisma.oAuthCredential.findFirst({
    where: {
      userId,
      provider,
      ...(service && { service })
    }
  })
}

