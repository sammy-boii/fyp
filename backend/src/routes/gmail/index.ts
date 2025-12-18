import { Hono,  } from 'hono'
import { gmailOAuthRoutes } from './oauth.routes'
import { gmailMessageRoutes } from './messages.routes'
import { authMiddleware } from '@/src/middleware/auth.middleware'

export const gmailRoutes = new Hono()

gmailRoutes.route('/oauth', gmailOAuthRoutes)

// cannot chain like Express 😔

gmailRoutes.use('/messages/*', authMiddleware)
gmailRoutes.route('/messages', gmailMessageRoutes)
