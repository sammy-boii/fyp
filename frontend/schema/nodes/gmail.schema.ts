import { z } from 'zod'

export const sendEmailFormSchema = z.object({
  to: z.string().min(1, 'Please enter a recipient'),
  attachmentType: z.enum(['url', 'drive']).default('url'),
  driveCredentialId: z.string().optional(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  attachments: z.string().optional() // URL or Google Drive file ID, comma-separated
})

export const readEmailFormSchema = z.object({
  maxResults: z.coerce
    .number()
    .min(1, 'Must fetch at least 1 email')
    .max(100, 'Maximum 100 emails')
    .default(10),
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  after: z.string().optional(), // Date string in YYYY-MM-DD format
  before: z.string().optional(), // Date string in YYYY-MM-DD format
  hasAttachment: z.boolean().default(false),
  isUnread: z.boolean().default(false),
  labelId: z.string().optional(),
  markAsRead: z.boolean().default(false),
  includeBody: z.boolean().default(true),
  includeAttachments: z.boolean().default(false)
})
