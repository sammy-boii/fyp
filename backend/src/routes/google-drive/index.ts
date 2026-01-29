import { Hono } from 'hono'
import { googleDriveOAuthRoutes } from './oauth.routes'
import { authMiddleware } from '@/src/middleware/auth.middleware'
import { listDriveItems } from '@/src/controllers/google-drive/files.controller'

export const googleDriveRoutes = new Hono()

googleDriveRoutes.route('/oauth', googleDriveOAuthRoutes)

// Protected routes for fetching drive data
googleDriveRoutes.get('/files', authMiddleware, listDriveItems)
