import { Hono } from 'hono'

export const webhookGmailRoutes = new Hono()

webhookGmailRoutes.post('/', async (c) => {
  const body = await c.req.json()
  console.log('BODY', body)
  return c.json({ body })
})
