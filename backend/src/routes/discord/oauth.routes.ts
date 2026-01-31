import { Hono } from 'hono'
import { addOrUpdateCredential } from '@/src/controllers/discord/credential.controller'
import { authMiddleware } from '@/src/middleware/auth.middleware'

export const discordOAuthRoutes = new Hono()

discordOAuthRoutes.get('/', authMiddleware, addOrUpdateCredential)
