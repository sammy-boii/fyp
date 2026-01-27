import { FRONTEND_BASE_URL } from '@/src/constants'
import { encryptToken } from '@/src/lib/crypto'
import { tryCatch } from '@/src/lib/utils'
import { AppError } from '@/src/types'
import { prisma } from '@shared/db/prisma'

export const addOrUpdateCredential = tryCatch(async (c) => {
  const googleUser = c.get('user-google')
  const user = c.get('user')
  const accessToken = c.get('token')
  const refreshToken = c.get('refresh-token')
  const scopes = c.get('granted-scopes')

  if (!googleUser?.email) {
    throw new AppError('Google user not found', 400)
  }

  if (!accessToken?.token || !refreshToken?.token) {
    throw new AppError('Access or refresh token not provided', 400)
  }

  const encryptedAccessToken = encryptToken(accessToken.token)
  const encryptedRefreshToken = encryptToken(refreshToken.token)

  const accessTokenExpiresAt = accessToken.expires_in
    ? new Date(Date.now() + accessToken.expires_in * 1000)
    : null

  const refreshTokenExpiresAt = refreshToken.expires_in
    ? new Date(Date.now() + refreshToken.expires_in * 1000)
    : null

  await prisma.oAuthCredential.upsert({
    where: {
      provider_service_userId: {
        provider: 'google',
        service: 'drive',
        userId: user.id
      }
    },
    update: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      scopes,
      notes: null
    },
    create: {
      userId: user.id,
      provider: 'google',
      service: 'drive',
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      scopes
    }
  })

  // must always return in hono else undefined will be returned which serealizes into {}
  return c.redirect(FRONTEND_BASE_URL + '/credentials')
})
