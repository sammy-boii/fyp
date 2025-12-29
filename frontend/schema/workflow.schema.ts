import { z } from 'zod'

export const workflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'paused']).optional(),
  nodes: z.array(z.any()).min(1, 'Workflow must have at least one node'),
  edges: z.array(z.any()).min(1, 'Workflow must have at least one edge')
})
