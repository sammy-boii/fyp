import { Hono } from 'hono'

export const webhookDiscordRoutes = new Hono()

webhookDiscordRoutes.post('/', async (c) => {
  const body = c.req.json()
  return c.json({ body })
})
