import { Hono } from 'hono'
import { discordOAuthRoutes } from './oauth.routes'
import { discordApiRoutes } from './api.routes'

export const discordRoutes = new Hono()

discordRoutes.route('/oauth', discordOAuthRoutes)
discordRoutes.route('/', discordApiRoutes)
