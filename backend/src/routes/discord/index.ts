import { Hono } from 'hono'
import { prisma } from '@shared/db/prisma'
import { encryptToken } from '../../lib/crypto'
import { authMiddleware } from '../../middleware/auth.middleware'

export const discordRoutes = new Hono()

// Route to add a Discord bot token
discordRoutes.post('/bot-token', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { botToken, notes } = await c.req.json()

    if (!botToken) {
      return c.json({ error: 'Bot token is required' }, 400)
    }

    // Validate the bot token by making a test request
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bot ${botToken}`
      }
    })

    if (!response.ok) {
      return c.json({ error: 'Invalid bot token' }, 400)
    }

    const botUser = await response.json()

    // Encrypt and store the bot token
    const encryptedToken = encryptToken(botToken)

    // Check if credential already exists
    const existingCredential = await prisma.oAuthCredential.findFirst({
      where: {
        userId: user.id,
        provider: 'discord',
        service: 'bot'
      }
    })

    let credential
    if (existingCredential) {
      // Update existing credential
      credential = await prisma.oAuthCredential.update({
        where: { id: existingCredential.id },
        data: {
          accessToken: encryptedToken,
          notes: notes || `Bot: ${botUser.username}`,
          accessTokenExpiresAt: null // Bot tokens don't expire
        }
      })
    } else {
      // Create new credential
      credential = await prisma.oAuthCredential.create({
        data: {
          userId: user.id,
          provider: 'discord',
          service: 'bot',
          accessToken: encryptedToken,
          notes: notes || `Bot: ${botUser.username}`,
          accessTokenExpiresAt: null // Bot tokens don't expire
        }
      })
    }

    return c.json({
      success: true,
      data: {
        id: credential.id,
        provider: credential.provider,
        service: credential.service,
        botUsername: botUser.username,
        botId: botUser.id
      }
    })
  } catch (error: any) {
    console.error('Error saving Discord bot token:', error)
    return c.json({ error: error.message || 'Failed to save bot token' }, 500)
  }
})

// OAuth route placeholder for future OAuth implementation
discordRoutes.get('/oauth', (c) => {
  return c.json({
    message:
      'Discord OAuth not implemented. Please use /api/discord/bot-token to add a bot token directly.'
  })
})
