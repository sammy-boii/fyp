import { Hono } from 'hono'

import { routes } from './routes'
import { PORT } from './constants'
import { cors } from 'hono/cors'

export const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:3000'],
    credentials: true
  })
)

app.route('/api', routes)

Bun.serve({
  fetch: app.fetch,
  port: PORT
})

console.log(`Server running at PORT ${PORT}`)
