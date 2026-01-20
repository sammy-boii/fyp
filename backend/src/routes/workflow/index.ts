import { Hono } from 'hono'
import { runWorkflow } from '@/src/controllers/workflow/workflow.controller'
import { executeSingleNode } from '@/src/controllers/workflow/node.controller'
import { authMiddleware } from '@/src/middleware/auth.middleware'

export const workflowRoutes = new Hono()

// Execute workflow
workflowRoutes.get('/run/:id', authMiddleware, runWorkflow)

// Execute single node
workflowRoutes.get(
  '/execute/:workflowId/:nodeId',
  authMiddleware,
  executeSingleNode
)
