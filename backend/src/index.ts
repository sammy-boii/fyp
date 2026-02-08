import { Hono } from 'hono'

import { routes } from './routes'
import { PORT } from './constants'
import { cors } from 'hono/cors'
import { websocketHandler } from './lib/websocket'
import { initDiscordBot } from './lib/discord-bot'
import { initTriggerCache } from './lib/trigger-cache'
import { initWorkflowScheduler } from './lib/workflow-scheduler'

export const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: [Bun.env.FRONTEND_BASE_URL || 'http://localhost:3000'],
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
  port: PORT,
  idleTimeout: 255 // Max 255 seconds (~4 mins) for long-running workflows
})

console.log(
  `Server running at PORT ${PORT} & WS at ws://localhost:${PORT}/ws/workflow/:workflowId`
)

// Initialize trigger cache first, then scheduled workflows, then Discord bot
initTriggerCache()
  .then(() => initWorkflowScheduler())
  .then(() => {
    initDiscordBot()
  })
