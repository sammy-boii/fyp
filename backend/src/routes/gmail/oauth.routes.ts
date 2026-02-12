import { Hono } from 'hono'
import { googleAuth } from '@hono/oauth-providers/google'
import { SCOPES } from '@/src/constants/scopes'
import { REDIRECT_URL } from '@/src/constants/redirect-url'
import { addOrUpdateCredential } from '@/src/controllers/gmail/credential.controller'
import { authMiddleware } from '@/src/middleware/auth.middleware'

export const gmailOAuthRoutes = new Hono()

// Handles both /oauth and /oauth/callback

gmailOAuthRoutes.use(
  '/*',
  googleAuth({
    client_id: process.env.GMAIL_CLIENT_ID,
    client_secret: process.env.GMAIL_CLIENT_SECRET,
    redirect_uri: REDIRECT_URL.GMAIL.OAUTH,
    scope: SCOPES.GMAIL,
    access_type: 'offline', // request refresh token
    prompt: 'consent'
  })
)

// runs after successful authentication
gmailOAuthRoutes.get('/callback', authMiddleware, addOrUpdateCredential)
