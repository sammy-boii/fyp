import { z } from 'zod'

export const sendEmailFormSchema = z.object({
  to: z.string().email('Please enter a valid email address'),
  subject: z.string().optional(),
  body: z.string().optional()
})
