import { z } from 'zod'

// Manual trigger doesn't need any configuration
export const manualTriggerFormSchema = z.object({})

// Gmail webhook trigger schema
export const gmailWebhookTriggerFormSchema = z.object({
  labelId: z.string().optional(),
  watchEvents: z.array(z.string()).default(['message_added'])
})

// Discord webhook trigger schema
export const discordWebhookTriggerFormSchema = z.object({
  guildId: z.string().min(1, 'Server is required'),
  channelId: z.string().min(1, 'Channel is required'),
  userId: z.string().optional()
})

// Schedule trigger schema
export const scheduleTriggerFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  loop: z.boolean().default(false)
})
