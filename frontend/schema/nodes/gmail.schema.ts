import { z } from 'zod'

export const sendEmailFormSchema = z.object({
  to: z.string().email('Please enter a valid email address'),
  subject: z.string().optional(),
  body: z.string().optional()
})

export const readEmailFormSchema = z.object({
  maxResults: z.coerce
    .number()
    .min(1, 'Must fetch at least 1 email')
    .max(100, 'Maximum 100 emails')
    .default(10),
  from: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  to: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  subject: z.string().optional(),
  after: z.string().optional(), // Date string in YYYY-MM-DD format
  before: z.string().optional(), // Date string in YYYY-MM-DD format
  hasAttachment: z.boolean().default(false),
  isUnread: z.boolean().default(false),
  labelId: z.string().optional()
})
