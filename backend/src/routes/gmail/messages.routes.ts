import { getEmails, sendEmail } from '@/src/controllers/gmail/email.controller'
import { Hono } from 'hono'

export const gmailMessageRoutes = new Hono()

gmailMessageRoutes.get('/', getEmails)
gmailMessageRoutes.post('/send', sendEmail)
