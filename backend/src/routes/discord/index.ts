import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'

export const discordRoutes = new Hono()

// Route to get bot info (verify the shared bot is configured)
discordRoutes.get('/bot-info', authMiddleware, async (c) => {
  try {
    const botToken = Bun.env.DISCORD_BOT_TOKEN

    if (!botToken) {
      return c.json({ error: 'Discord bot not configured on server' }, 500)
    }

    // Fetch bot info from Discord
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bot ${botToken}`
      }
    })

    if (!response.ok) {
      return c.json({ error: 'Failed to fetch bot info' }, 500)
    }

    const botUser = await response.json()

    return c.json({
      success: true,
      data: {
        botId: botUser.id,
        botUsername: botUser.username,
        discriminator: botUser.discriminator
      }
    })
  } catch (error: any) {
    console.error('Error fetching Discord bot info:', error)
    return c.json({ error: error.message || 'Failed to fetch bot info' }, 500)
  }
})

// Route to get invite URL
discordRoutes.get('/invite-url', (c) => {
  const clientId = Bun.env.DISCORD_CLIENT_ID || '1466759269763514513'
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot`

  return c.json({
    success: true,
    data: {
      inviteUrl
    }
  })
})
