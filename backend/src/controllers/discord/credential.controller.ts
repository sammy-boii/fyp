import { FRONTEND_BASE_URL } from '@/src/constants'
import { tryCatch } from '@/src/lib/utils'
import { prisma } from '@shared/db/prisma'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

/**
 * Fetch guild info from Discord API using the bot token
 */
async function fetchGuildInfo(guildId: string, botToken: string) {
  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}

/**
 * Handle Discord OAuth callback when a user authorizes the bot to a server.
 *
 * Discord bot authorization flow:
 * - User clicks "Add to Server" link
 * - Discord redirects back with guild_id (the server they added bot to)
 * - We store a credential record to track this authorization
 * - We also store the guild in DiscordGuild table to track user's authorized guilds
 * - The actual bot token is stored in DISCORD_BOT_TOKEN env variable (shared)
 */
export const addOrUpdateCredential = tryCatch(async (c) => {
  const user = c.get('user')
  const guildId = c.req.query('guild_id')

  // The scope to read guild memebers and messages belongs to the bot, not the user
  const scopes = ['bot', 'email']

  // Create or update the credential
  const credential = await prisma.oAuthCredential.upsert({
    where: {
      provider_service_userId: {
        provider: 'discord',
        service: 'bot',
        userId: user.id
      }
    },
    update: {
      scopes,
      notes: guildId ? `Last authorized guild: ${guildId}` : null
    },
    create: {
      userId: user.id,
      provider: 'discord',
      service: 'bot',
      // Bot token is stored server-side in env, not per-user
      accessToken: 'DISCORD_BOT_TOKEN',
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scopes,
      notes: guildId ? `Last authorized guild: ${guildId}` : null
    }
  })

  // If a guild was authorized, add it to the user's list of authorized guilds
  if (guildId) {
    // Try to fetch guild name from Discord API
    let guildName: string | null = null
    const botToken = process.env.DISCORD_BOT_TOKEN

    if (botToken) {
      const guildInfo = await fetchGuildInfo(guildId, botToken)
      if (guildInfo) {
        guildName = guildInfo.name
      }
    }

    // Upsert the guild (in case user re-authorizes the same guild)
    await prisma.discordGuild.upsert({
      where: {
        credentialId_guildId: {
          credentialId: credential.id,
          guildId: guildId
        }
      },
      update: {
        guildName: guildName
      },
      create: {
        credentialId: credential.id,
        guildId: guildId,
        guildName: guildName
      }
    })
  }

  return c.redirect(FRONTEND_BASE_URL + '/credentials')
})
