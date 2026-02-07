import { Hono } from 'hono'
import { googleAuth } from '@hono/oauth-providers/google'
import { SCOPES } from '@/src/constants/scopes'
import { REDIRECT_URL } from '@/src/constants/redirect-url'
import { addOrUpdateCredential } from '@/src/controllers/google-drive/credential.controller'
import { authMiddleware } from '@/src/middleware/auth.middleware'

export const googleDriveOAuthRoutes = new Hono()

// Handles both /oauth and /oauth/callback

googleDriveOAuthRoutes.use(
  '/*',
  googleAuth({
    client_id: Bun.env.GOOGLE_DRIVE_CLIENT_ID,
    client_secret: Bun.env.GOOGLE_DRIVE_CLIENT_SECRET,
    redirect_uri: REDIRECT_URL.DRIVE.OAUTH,
    scope: SCOPES.GOOGLE_DRIVE,
    access_type: 'offline', // request refresh token
    prompt: 'consent'
  })
)

// runs after successful authentication
googleDriveOAuthRoutes.get('/callback', authMiddleware, addOrUpdateCredential)
