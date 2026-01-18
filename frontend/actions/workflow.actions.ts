'use server'

import { api } from '@/lib/api'

import { prisma } from '@shared/db/prisma'
import { tryCatch } from '@/lib/utils'
import { getCurrentUser } from '@/data/dal'
import { createWorkflowSchema } from '@/schema/workflow.schema'
import { Workflow } from '@shared/prisma/generated/prisma/client'
import { cookies } from 'next/headers'
import { BACKEND_URL } from '@/constants'

export async function getWorkflows() {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const workflows = await prisma.workflow.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: 'desc' }
    })

    return workflows
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
        status: parsedData.status,
        nodes: parsedData.nodes,
        edges: parsedData.edges ?? []
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


    // Call backend API to execute workflow
    // Token is auto-attached by api client via cookies
    const result = await api.get(`api/workflow/run/${id}`).json<any>()

    return result
  })
}
