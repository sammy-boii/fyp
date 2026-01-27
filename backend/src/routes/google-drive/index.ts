import { Hono } from 'hono'
import { googleDriveOAuthRoutes } from './oauth.routes'

export const googleDriveRoutes = new Hono()

googleDriveRoutes.route('/oauth', googleDriveOAuthRoutes)
