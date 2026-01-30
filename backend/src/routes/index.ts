import { Context, Hono } from 'hono'
import { gmailRoutes } from './gmail'
import { discordRoutes } from './discord'
import { googleDriveRoutes } from './google-drive'
import { workflowRoutes } from './workflow'

export const routes = new Hono()

routes.get('/test', (c: Context) => {
  console.log(c.body)
  console.log('WOWOWOOWOWOWO')
  return c.json({ messege: 'WOW' })
})

routes.route('/gmail', gmailRoutes)
routes.route('/google-drive', googleDriveRoutes)
routes.route('/discord', discordRoutes)
routes.route('/workflow', workflowRoutes)
