import { Hono } from 'hono'
import { runWorkflow } from '@/src/controllers/workflow/workflow.controller'
import { executeSingleNode } from '@/src/controllers/workflow/node.controller'
import {
  updateWorkflowCache,
  refreshWorkflowCache,
  removeWorkflowCache
} from '@/src/controllers/workflow/cache.controller'
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

// Update trigger cache (called when Discord webhook workflow activation changes)
workflowRoutes.patch('/:id/update-cache', authMiddleware, updateWorkflowCache)

// Refresh trigger cache (called on any workflow save/update to ensure cache consistency)
workflowRoutes.patch('/:id/refresh-cache', authMiddleware, refreshWorkflowCache)

// Remove workflow from trigger cache (called before workflow deletion)
workflowRoutes.delete('/:id/cache', authMiddleware, removeWorkflowCache)
