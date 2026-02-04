import { z } from 'zod'

export const aiPromptFormSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required')
})

export type AIPromptFormData = z.infer<typeof aiPromptFormSchema>
