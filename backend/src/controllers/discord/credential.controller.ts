import { FRONTEND_BASE_URL } from '@/src/constants'
import { tryCatch } from '@/src/lib/utils'
import { prisma } from '@shared/db/prisma'

export const addOrUpdateCredential = tryCatch(async (c) => {
  //   const userID = c.req.query('state')
  //   const guildID = c.req.query('guild_id')
  //   const code = c.req.query('code')
  const user = c.get('user')

  await prisma.oAuthCredential.upsert({
    where: {
      provider_service_userId: {
        provider: 'discord',
        service: 'bot',
        userId: user.id
      }
    },
    update: {
      notes: null
    },
    create: {
      userId: user.id,
      provider: 'discord',
      service: 'bot',
      accessToken: 'DISCORD_BOT_TOKEN', // stored server side
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scopes: ['bot']
    }
  })

  // must always return in hono else undefined will be returned which serealizes into {}
  return c.redirect(FRONTEND_BASE_URL + '/credentials')
})
