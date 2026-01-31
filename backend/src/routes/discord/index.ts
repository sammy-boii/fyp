import { Hono } from 'hono'
import { discordOAuthRoutes } from './oauth.routes'

export const discordRoutes = new Hono()

discordRoutes.route('/oauth', discordOAuthRoutes)
