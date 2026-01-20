import { Hono } from 'hono'
import { gmailOAuthRoutes } from './oauth.routes'

export const gmailRoutes = new Hono()

gmailRoutes.route('/oauth', gmailOAuthRoutes)
