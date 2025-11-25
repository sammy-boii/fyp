import { Hono } from 'hono'
import { googleAuth } from '@hono/oauth-providers/google'
import { SCOPES } from '@/src/constants/scopes'
import { REDIRECT_URL } from '@/src/constants/redirect-url'
import { prisma } from '@shared/db/prisma'
import { encryptToken } from '@/src/lib/crypto'
import { tryCatch } from '@/src/lib/utils'
import { AppError } from '@/src/types'

export const gmailOAuthRoutes = new Hono()

// Handles both /oauth and /oauth/callback

gmailOAuthRoutes.use(
  '/*',
  googleAuth({
    client_id: Bun.env.GOOGLE_CLIENT_ID,
    client_secret: Bun.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: REDIRECT_URL.GMAIL.OAUTH,
    scope: SCOPES.GMAIL,
    access_type: 'offline',
    prompt: 'consent'
  })
)

// Runs after successful authentication

gmailOAuthRoutes.get(
  '/callback',
  tryCatch(async (c) => {
    const user = c.get('user-google')
    const token = c.get('token')
    const refreshToken = c.get('refresh-token')
    const scopes = c.get('granted-scopes')

    if (!user?.email) {
      throw new AppError('Google user not found', 400)
    }

    if (!token?.token || !refreshToken?.token) {
      throw new AppError('Access or refresh token not provided', 400)
    }

    if (!token.expires_in || !refreshToken.expires_in) {
      throw new AppError('Token expiry information not provided', 400)
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!existingUser) {
      throw new AppError('User not found. Please register first.', 404)
    }

    const encryptedAccessToken = encryptToken(token.token)
    const encryptedRefreshToken = encryptToken(refreshToken.token)

    const accessTokenExpiresAt = new Date(Date.now() + token.expires_in * 1000)
    const refreshTokenExpiresAt = new Date(
      Date.now() + refreshToken.expires_in * 1000
    )

    await prisma.oAuthCredential.upsert({
      where: {
        provider_service_userId: {
          provider: 'google',
          service: 'gmail',
          userId: existingUser.id
        }
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        scopes
      },
      create: {
        userId: existingUser.id,
        provider: 'google',
        service: 'gmail',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        scopes
      }
    })

    return 'Successfully authenticated user with Gmail'
  })
)
