import { Hono } from 'hono'

import { routes } from './routes'
import { PORT } from './constants'
import { cors } from 'hono/cors'
import { websocketHandler } from './lib/websocket'
import { initDiscordBot, shutdownDiscordBot } from './lib/discord-bot'
import { initTriggerCache } from './lib/trigger-cache'
import { initWorkflowScheduler } from './lib/workflow-scheduler'

export const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:3000'],
    credentials: true
  })
)

app.route('/api', routes)

const server = Bun.serve({
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

const bootstrapBackgroundServices = async (): Promise<void> => {
  try {
    // Initialize trigger cache first, then scheduled workflows, then Discord bot.
    await initTriggerCache()
    await initWorkflowScheduler()
    await initDiscordBot()
  } catch (error) {
    console.error('❌ Failed to bootstrap background services:', error)
  }
}

void bootstrapBackgroundServices()

let isShuttingDown = false

const gracefulShutdown = async (signal: 'SIGTERM' | 'SIGINT') => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.warn(`[shutdown] received ${signal}, shutting down services...`)

  try {
    await shutdownDiscordBot()
  } catch (error) {
    console.error('[shutdown] error during Discord shutdown:', error)
  }

  try {
    server.stop(true)
    console.warn('[shutdown] HTTP server stopped')
  } catch (error) {
    console.error('[shutdown] error while stopping HTTP server:', error)
  }

  console.warn('[shutdown] process exit')
  process.exit(0)
}

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM')
})

process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT')
})
