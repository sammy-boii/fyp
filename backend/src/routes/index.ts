import { Hono } from 'hono'
import { gmailRoutes } from './gmail'
import { googleDocsRoutes } from './google-docs'
import { googleCalendarRoutes } from './google-calendar'
import { discordRoutes } from './discord'
import { googleDriveRoutes } from './google-drive'

export const routes = new Hono()

routes.route('/gmail', gmailRoutes)
routes.route('/google-drive', googleDriveRoutes)
routes.route('/google-docs', googleDocsRoutes)
routes.route('/google-calendar', googleCalendarRoutes)
routes.route('/discord', discordRoutes)
