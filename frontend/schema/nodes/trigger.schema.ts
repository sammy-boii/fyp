import { z } from 'zod'

// Manual trigger doesn't need any configuration
export const manualTriggerFormSchema = z.object({})

// Gmail webhook trigger schema
export const gmailWebhookTriggerFormSchema = z.object({
  labelId: z.string().optional(),
  watchEvents: z.array(z.string()).default(['message_added'])
})
