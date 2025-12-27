'use server'

import { prisma } from '@shared/db/prisma'
import { tryCatch } from '@/lib/utils'
import { getCurrentUser } from '@/data/dal'
import { z } from 'zod'

const workflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'paused']).optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any())
})

const createWorkflowSchema = workflowSchema.extend({
  name: z.string().min(1, 'Workflow name is required')
})

export async function getWorkflows() {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    console.log('USER', user)
    if (!user) {
      throw new Error('Not authenticated')
    }

    const workflows = await prisma.workflow.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { executions: true }
        }
      }
    })

    // Get the last execution for each workflow
    const workflowsWithLastExecution = await Promise.all(
      workflows.map(async (workflow) => {
        const lastExecution = await prisma.workflowExecution.findFirst({
          where: { workflowId: workflow.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })

        // Count nodes from the workflow definition
        const nodes = (workflow.nodes as any[]) || []
        const nodeCount = nodes.length

        return {
          id: workflow.id,
          name: workflow.name || 'Untitled Workflow',
          lastExecutedAt: lastExecution?.createdAt.toISOString() || null,
          nodeCount,
          status:
            (workflow.status as 'active' | 'inactive' | 'paused') || 'inactive',
          createdAt: workflow.createdAt.toISOString(),
          updatedAt: workflow.updatedAt.toISOString()
        }
      })
    )

    return workflowsWithLastExecution
  })
}

export async function getWorkflow(id: number) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        authorId: user.id
      }
    })

    if (!workflow) {
      throw new Error('Workflow not found or access denied')
    }

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      nodes: workflow.nodes,
      edges: workflow.edges,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString()
    }
  })
}

export async function createWorkflow(data: {
  name: string
  description?: string
  status?: 'active' | 'inactive' | 'paused'
  nodes: any[]
  edges: any[]
}) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const parsedData = createWorkflowSchema.parse(data)

    const workflow = await prisma.workflow.create({
      data: {
        authorId: user.id,
        name: parsedData.name,
        description: parsedData.description || null,
        status: parsedData.status || 'inactive',
        nodes: parsedData.nodes,
        edges: parsedData.edges
      }
    })

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      nodes: workflow.nodes,
      edges: workflow.edges,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString()
    }
  })
}

export async function updateWorkflow(
  id: number,
  data: {
    name?: string
    description?: string
    status?: 'active' | 'inactive' | 'paused'
    nodes?: any[]
    edges?: any[]
  }
) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Verify the workflow belongs to the current user
    const existing = await prisma.workflow.findFirst({
      where: {
        id,
        authorId: user.id
      }
    })

    if (!existing) {
      throw new Error('Workflow not found or access denied')
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined)
      updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.nodes !== undefined) updateData.nodes = data.nodes
    if (data.edges !== undefined) updateData.edges = data.edges

    const workflow = await prisma.workflow.update({
      where: { id },
      data: updateData
    })

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      nodes: workflow.nodes,
      edges: workflow.edges,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString()
    }
  })
}

export async function deleteWorkflow(id: number) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Verify the workflow belongs to the current user
    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        authorId: user.id
      }
    })

    if (!workflow) {
      throw new Error('Workflow not found or access denied')
    }

    await prisma.workflow.delete({
      where: { id }
    })

    return { success: true }
  })
}
