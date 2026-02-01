import { Hono } from 'hono'
import { authMiddleware } from '@/src/middleware/auth.middleware'
import {
  listGuilds,
  listChannels,
  listGuildMembers
} from '@/src/controllers/discord/data.controller'

export const discordApiRoutes = new Hono()

// Protected routes for fetching Discord data
discordApiRoutes.use('/*', authMiddleware)

discordApiRoutes.get('/guilds', listGuilds)
discordApiRoutes.get('/channels', listChannels)
discordApiRoutes.get('/members', listGuildMembers)
