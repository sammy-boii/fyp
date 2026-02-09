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
import { TRIGGER_ACTION_ID } from '@shared/constants'

type ScheduleConfig = {
  date?: string
  time?: string
  loop?: boolean
}

type AIWorkflowResponse = {
  nodes: any[]
  edges: any[]
  error?: string
}

function buildScheduleValue(nodes?: any[]): string | null | undefined {
  if (!nodes) return undefined

  const scheduleTrigger = nodes.find(
    (node) => node?.data?.actionId === TRIGGER_ACTION_ID.SCHEDULE_TRIGGER
  )

  if (!scheduleTrigger) return null

  const config = (scheduleTrigger.data?.config || {}) as ScheduleConfig
  const date = config.date?.trim()
  const time = config.time?.trim()

  if (!date || !time) return null

  const [rawHour, rawMinute] = time.split(':')
  const hour = Number(rawHour)
  const minute = Number(rawMinute)

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  const normalizedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  if (config.loop) {
    return `cron:${String(minute).padStart(2, '0')} ${String(hour).padStart(2, '0')} * * *`
  }

  return `once:${date}T${normalizedTime}:00`
}

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

    const latestExecution = await prisma.workflowExecution.findFirst({
      where: {
        workflowId: id,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' },
      include: {
        nodeExecutions: {
          select: {
            nodeId: true,
            outputData: true
          }
        }
      }
    })

    if (latestExecution && Array.isArray(workflow.nodes)) {
      const nodeOutputMap = new Map(
        latestExecution.nodeExecutions.map((ne) => [ne.nodeId, ne.outputData])
      )

      const nodesWithOutput = (workflow.nodes as any[]).map((node) => ({
        ...node,
        data: {
          ...node.data,
          lastOutput: nodeOutputMap.get(node.id) || undefined
        }
      }))

      return {
        ...workflow,
        nodes: nodesWithOutput
      }
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

    const schedule = buildScheduleValue(parsedData.nodes as any[] | undefined)

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...parsedData,
        ...(schedule !== undefined ? { schedule } : {})
      }
    })

    try {
      await api.patch(`api/workflow/${id}/refresh-cache`).json()
    } catch (err) {
      console.error('Failed to refresh trigger cache:', err)
    }

    return workflow
  })
}

export async function deleteWorkflow(id: string) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const workflow = await prisma.workflow.findUnique({
      where: {
        id,
        authorId: user.id
      }
    })

    if (!workflow) {
      throw new Error('Workflow not found or access denied')
    }

    try {
      await api.delete(`api/workflow/${id}/cache`).json()
    } catch (err) {
      console.error('Failed to remove workflow from trigger cache:', err)
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

    return result
  })
}

export async function executeNode(workflowId: string, nodeId: string) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

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

    return result
  })
}

export async function generateWorkflowFromPrompt(prompt: string) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const data = await api
      .post('api/ai/generate-workflow', {
        json: { prompt }
      })
      .json<AIWorkflowResponse>()

    if (data.error) {
      return { data: null, error: data.error || 'Failed to generate workflow' }
    }

    return { data, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to generate workflow'
    return { data: null, error: message }
  }
}
