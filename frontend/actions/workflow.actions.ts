'use server'

import { api } from '@/lib/api'

import { prisma } from '@shared/db/prisma'
import { ApiResponse, tryCatch } from '@/lib/utils'
import { getCurrentUser } from '@/data/dal'
import {
  createWorkflowSchema,
  updateWorkflowSchema
} from '@/schema/workflow.schema'
import {
  Workflow,
  WorkflowExecution
} from '@shared/prisma/generated/prisma/client'
import { NodeExecutionResult } from '@/types/index.types'

export async function getWorkflows() {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const workflows = await prisma.workflow.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        executions: {
          select: { id: true }
        }
      }
    })

    return workflows.map((w) => ({
      ...w,
      executionCount: w.executions.length
    }))
  })
}

export async function getWorkflow(id: string) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const workflow = await prisma.workflow.findUnique({
      where: {
        id: id,
        authorId: user.id
      }
    })

    if (!workflow) {
      throw new Error('Workflow not found or access denied')
    }

    return workflow
  })
}

export async function createWorkflow(data: Partial<Workflow>) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const parsedData = createWorkflowSchema.parse(data)

    const workflow = await prisma.workflow.create({
      data: {
        author: { connect: { id: user.id } },
        name: parsedData.name,
        description: parsedData.description,
        nodes: parsedData.nodes,
        edges: parsedData.edges ?? []
      }
    })

    return workflow
  })
}

export async function updateWorkflow(id: string, data: Partial<Workflow>) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Verify the workflow belongs to the current user
    const existing = await prisma.workflow.findUnique({
      where: {
        id,
        authorId: user.id
      }
    })

    if (!existing) {
      throw new Error('Workflow not found or access denied')
    }

    const parsedData = updateWorkflowSchema.parse(data)

    const workflow = await prisma.workflow.update({
      where: { id },
      data: parsedData
    })

    return workflow
  })
}

export async function deleteWorkflow(id: string) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Verify the workflow belongs to the current user
    const workflow = await prisma.workflow.findUnique({
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

export async function executeWorkflow(id: string) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Verify the workflow belongs to the current user
    const workflow = await prisma.workflow.findUnique({
      where: {
        id,
        authorId: user.id
      }
    })

    if (!workflow) {
      throw new Error('Workflow not found or access denied')
    }

    const result = await api
      .get(`api/workflow/run/${id}`)
      .json<ApiResponse<WorkflowExecution>>()
    console.log('RESULT', result)

    return result
  })
}

export async function executeNode(workflowId: string, nodeId: string) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Verify the workflow belongs to the current user
    const workflow = await prisma.workflow.findUnique({
      where: {
        id: workflowId,
        authorId: user.id
      }
    })

    if (!workflow) {
      throw new Error('Workflow not found or access denied')
    }

    const result = await api
      .get(`api/workflow/execute/${workflowId}/${nodeId}`)
      .json<NodeExecutionResult>()

    console.log('RESULT', result)
    return result
  })
}
