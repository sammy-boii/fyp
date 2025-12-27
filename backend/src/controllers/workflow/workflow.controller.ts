import { Context } from 'hono'
import { tryCatch } from '@/src/lib/utils'
import { AppError } from '@/src/types'
import { WorkflowExecutionService } from '@/src/services/workflow-execution.service'
import { prisma } from '@shared/db/prisma'

const executionService = new WorkflowExecutionService()

export const executeWorkflow = tryCatch(async (c: Context) => {
  const workflowId = parseInt(c.req.param('id'))
  const user = c.get('user') // From auth middleware

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  const userId = user.id

  if (isNaN(workflowId)) {
    throw new AppError('Invalid workflow ID', 400)
  }

  // Optional: Get trigger data from request body
  const body = await c.req.json().catch(() => ({}))
  const triggerData = body.data || null

  const result = await executionService.executeWorkflow(
    workflowId,
    userId,
    triggerData
  )

  return result
})

export const getExecutionHistory = tryCatch(async (c: Context) => {
  const workflowId = parseInt(c.req.param('id'))
  const user = c.get('user')

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  const userId = user.id

  if (isNaN(workflowId)) {
    throw new AppError('Invalid workflow ID', 400)
  }

  const history = await executionService.getExecutionHistory(
    workflowId,
    userId
  )

  return history
})

export const getExecution = tryCatch(async (c: Context) => {
  const executionId = c.req.param('executionId')
  const user = c.get('user')

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  const userId = user.id

  if (!executionId) {
    throw new AppError('Invalid execution ID', 400)
  }

  const execution = await executionService.getExecution(executionId, userId)

  return execution
})

export const createWorkflow = tryCatch(async (c: Context) => {
  const user = c.get('user')

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  const userId = user.id

  const body = await c.req.json()
  const { name, description, nodes, edges, status } = body

  if (!nodes || !edges) {
    throw new AppError('Nodes and edges are required', 400)
  }

  const workflow = await prisma.workflow.create({
    data: {
      authorId: userId,
      name: name || null,
      description: description || null,
      status: status || 'inactive',
      nodes: nodes,
      edges: edges
    }
  })

  return workflow
})

export const updateWorkflow = tryCatch(async (c: Context) => {
  const workflowId = parseInt(c.req.param('id'))
  const user = c.get('user')

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  const userId = user.id

  if (isNaN(workflowId)) {
    throw new AppError('Invalid workflow ID', 400)
  }

  const body = await c.req.json()
  const { name, description, nodes, edges, status } = body

  // Verify ownership
  const existing = await prisma.workflow.findUnique({
    where: { id: workflowId }
  })

  if (!existing || existing.authorId !== userId) {
    throw new AppError('Workflow not found or unauthorized', 404)
  }

  const workflow = await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(nodes !== undefined && { nodes }),
      ...(edges !== undefined && { edges }),
      ...(status !== undefined && { status })
    }
  })

  return workflow
})

export const getWorkflows = tryCatch(async (c: Context) => {
  const user = c.get('user')

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  const userId = user.id

  const workflows = await prisma.workflow.findMany({
    where: { authorId: userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { executions: true }
      }
    }
  })

  return workflows.map((w) => ({
    ...w,
    executionCount: w._count.executions
  }))
})

export const getWorkflow = tryCatch(async (c: Context) => {
  const workflowId = parseInt(c.req.param('id'))
  const user = c.get('user')

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  const userId = user.id

  if (isNaN(workflowId)) {
    throw new AppError('Invalid workflow ID', 400)
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      _count: {
        select: { executions: true }
      }
    }
  })

  if (!workflow || workflow.authorId !== userId) {
    throw new AppError('Workflow not found or unauthorized', 404)
  }

  return workflow
})

