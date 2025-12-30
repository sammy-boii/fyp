import { z } from 'zod'
import { WorkflowStatus } from '@shared/prisma/generated/prisma/client'

export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  status: z.nativeEnum(WorkflowStatus).default(WorkflowStatus.INACTIVE),
  // Allow empty workflows on initial create; nodes/edges will be populated later in the editor
  nodes: z.array(z.any()),
  edges: z.array(z.any())
})
