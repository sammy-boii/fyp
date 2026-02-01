import { Hono } from 'hono'
import { webhookGmailRoutes } from './gmail'
import { webhookDiscordRoutes } from './discord'

export const webhookRoutes = new Hono()

webhookRoutes.route('/gmail', webhookGmailRoutes)
webhookRoutes.route('/discord', webhookDiscordRoutes)
