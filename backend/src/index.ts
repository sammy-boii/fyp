import { Hono } from 'hono'

import { routes } from './routes'
import { PORT } from './constants'
import { cors } from 'hono/cors'
import { websocketHandler } from './lib/websocket'

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
  fetch(req, server) {
    const url = new URL(req.url)

    // Handle WebSocket upgrade for /ws/workflow/:workflowId
    if (url.pathname.startsWith('/ws/workflow/')) {
      const workflowId = url.pathname.split('/ws/workflow/')[1]

      if (workflowId) {
        const upgraded = server.upgrade(req, {
          data: { workflowId }
        })

        if (upgraded) {
          return undefined // Return undefined for successful upgrade
        }

        return new Response('WebSocket upgrade failed', { status: 400 })
      }
    }

    // Handle regular HTTP requests with Hono
    return app.fetch(req, server)
  },
  websocket: websocketHandler,
  port: PORT
})

console.log(`Server running at PORT ${PORT}`)
console.log(
  `WebSocket available at ws://localhost:${PORT}/ws/workflow/:workflowId`
)
