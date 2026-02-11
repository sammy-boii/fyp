import { z } from 'zod'

export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  // Allow empty workflows on initial create; nodes/edges will be populated later in the editor
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  schedule: z.string().nullable().optional()
})

// Use partial schema for updates - all fields optional
export const updateWorkflowSchema = createWorkflowSchema.partial().extend({
  // Allow clearing description on update
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional()
})
