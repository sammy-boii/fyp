import { FRONTEND_BASE_URL } from '@/src/constants'
import { tryCatch } from '@/src/lib/utils'
import { prisma } from '@shared/db/prisma'

/**
 * Handle Discord OAuth callback when a user authorizes the bot to a server.
 * 
 * Discord bot authorization flow:
 * - User clicks "Add to Server" link
 * - Discord redirects back with guild_id (the server they added bot to)
 * - We store a credential record to track this authorization
 * - The actual bot token is stored in DISCORD_BOT_TOKEN env variable (shared)
 */
export const addOrUpdateCredential = tryCatch(async (c) => {
  const user = c.get('user')
  const guildId = c.req.query('guild_id')
  const permissions = c.req.query('permissions')

  // Store the scopes that were granted
  const scopes = [
    'bot',
    'guilds.channels.read',
    'guilds.members.read',
   
  ]

  await prisma.oAuthCredential.upsert({
    where: {
      provider_service_userId: {
        provider: 'discord',
        service: 'bot',
        userId: user.id
      }
    },
    update: {
      scopes,
      notes: guildId ? `Authorized for guild: ${guildId}` : null
    },
    create: {
      userId: user.id,
      provider: 'discord',
      service: 'bot',
      // Bot token is stored server-side in env, not per-user
      accessToken: 'SERVER_BOT_TOKEN',
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scopes,
      notes: guildId ? `Authorized for guild: ${guildId}` : null
    }
  })

  return c.redirect(FRONTEND_BASE_URL + '/credentials')
})
