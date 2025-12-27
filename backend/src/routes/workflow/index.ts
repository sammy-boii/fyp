import { Hono } from 'hono'
import {
  executeWorkflow,
  getExecutionHistory,
  getExecution,
  createWorkflow,
  updateWorkflow,
  getWorkflows,
  getWorkflow
} from '@/src/controllers/workflow/workflow.controller'
import { authMiddleware } from '@/src/middleware/auth.middleware'

export const workflowRoutes = new Hono()

// All workflow routes require authentication
workflowRoutes.use('/*', authMiddleware)

// Workflow CRUD
workflowRoutes.get('/', getWorkflows)
workflowRoutes.post('/', createWorkflow)
workflowRoutes.get('/:id', getWorkflow)
workflowRoutes.patch('/:id', updateWorkflow)

// Workflow execution
workflowRoutes.post('/:id/execute', executeWorkflow)
workflowRoutes.get('/:id/executions', getExecutionHistory)
workflowRoutes.get('/executions/:executionId', getExecution)

