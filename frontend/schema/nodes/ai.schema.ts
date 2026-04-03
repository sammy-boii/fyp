import { z } from 'zod'

export const aiCustomFieldSchema = z.object({
  key: z.string().min(1, 'Field name is required'),
  value: z.string().optional().default('')
})

const aiCustomFieldsSchema = z
  .array(aiCustomFieldSchema)
  .superRefine((fields, ctx) => {
    const seen = new Set<string>()

    fields.forEach((field, index) => {
      const normalizedKey = field.key.trim().toLowerCase()
      if (!normalizedKey) {
        return
      }

      if (seen.has(normalizedKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate field name',
          path: [index, 'key']
        })
      }

      seen.add(normalizedKey)
    })
  })
  .optional()
  .default([])

export const aiPromptFormSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  systemPrompt: z.string().optional().default(''),
  customFields: aiCustomFieldsSchema
})

export type AICustomField = z.infer<typeof aiCustomFieldSchema>

export type AIPromptFormData = z.infer<typeof aiPromptFormSchema>
