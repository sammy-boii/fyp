import { Context, Hono } from 'hono'
import { gmailRoutes } from './gmail'
import { googleDriveRoutes } from './google-drive'
import { workflowRoutes } from './workflow'
import { discordRoutes } from './discord'
import { webhookRoutes } from './webhook'

export const routes = new Hono()

routes.get('/test', (c: Context) => {
  return c.json({ messege: 'WOW' })
})

routes.route('/gmail', gmailRoutes)
routes.route('/google-drive', googleDriveRoutes)
routes.route('/discord', discordRoutes)

routes.route('/webhook', webhookRoutes)

routes.route('/workflow', workflowRoutes)
