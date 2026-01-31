'use server'

import { getCurrentUser } from '@/data/dal'
import { tryCatch } from '@/lib/utils'
import { prisma } from '@shared/db/prisma'
import bcrypt from 'bcrypt'
import { TResetPasswordForm } from '@/types/auth.types'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { TChangePassword, TUpdateProfile } from '@/types/user.types'
import {
  changePasswordSchema,
  resetPasswordSchema,
  updateProfileSchema
} from '@/schema/user.schema'
import { TActionID } from '@shared/constants'

export async function getProfile() {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('User not found')
    }

    const [workflows, credentials] = await Promise.all([
      prisma.workflow.count({ where: { authorId: user.id } }),
      prisma.oAuthCredential.count({ where: { userId: user.id } })
    ])

    return {
      ...user,
      workflowsCount: workflows,
      credentialsCount: credentials
    }
  })
}

export async function updateProfile(data: TUpdateProfile) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const parsedData = updateProfileSchema.parse(data)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsedData.name,
        avatar: parsedData.avatar ?? null
      }
    })

    return updatedUser
  })
}

export async function changePassword(data: TChangePassword) {
  return tryCatch(async () => {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      throw new Error('Not authenticated')
    }

    const parsedData = changePasswordSchema.parse(data)

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      omit: {
        password: false
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isPasswordValid = await bcrypt.compare(
      parsedData.currentPassword,
      user.password
    )

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    const hashedPassword = await bcrypt.hash(parsedData.newPassword, 10)

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        password: hashedPassword
      }
    })
  })
}

export async function resetPassword(data: TResetPasswordForm) {
  return tryCatch(async () => {
    const parsedData = resetPasswordSchema.parse(data)

    let email: string
    try {
      const payload = jwt.verify(
        parsedData.token,
        process.env.JWT_SECRET as string
      ) as JwtPayload
      email = payload.email as string
    } catch {
      throw new Error('Invalid or expired reset link')
    }

    const user = await prisma.user.findUnique({
      where: { email },
      omit: {
        password: false
      }
    })

    if (!user) {
      throw new Error('User by that email not found')
    }

    const hashedPassword = await bcrypt.hash(parsedData.password, 10)

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword
      }
    })
  })
}

export async function getDashboardStats() {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('User not found')
    }

    // Get date range for the last 90 days
    const now = new Date()
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Fetch all executions for the user's workflows in the last 90 days
    const executions = await prisma.workflowExecution.findMany({
      where: {
        workflow: {
          authorId: user.id
        },
        createdAt: {
          gte: ninetyDaysAgo
        }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        nodeExecutions: {
          select: {
            actionId: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group executions by date for area chart
    const executionsByDate: Record<
      string,
      { completed: number; failed: number }
    > = {}

    // Initialize all dates in range with zeros
    for (
      let d = new Date(ninetyDaysAgo);
      d <= now;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = d.toISOString().split('T')[0]
      executionsByDate[dateKey] = { completed: 0, failed: 0 }
    }

    // Count action usage for radar chart
    const actionUsage: Partial<Record<TActionID, number>> = {}

    // Process executions
    let totalCompleted = 0
    let totalFailed = 0

    for (const execution of executions) {
      const dateKey = execution.createdAt.toISOString().split('T')[0]

      if (execution.status === 'COMPLETED') {
        executionsByDate[dateKey].completed++
        totalCompleted++
      } else if (execution.status === 'FAILED') {
        executionsByDate[dateKey].failed++
        totalFailed++
      }

      // Count action usage
      for (const nodeExec of execution.nodeExecutions) {
        const actionId = nodeExec.actionId as TActionID
        actionUsage[actionId] = (actionUsage[actionId] || 0) + 1
      }
    }

    // Format data for area chart
    const executionsOverTime = Object.entries(executionsByDate).map(
      ([date, counts]) => ({
        date,
        completed: counts.completed,
        failed: counts.failed
      })
    )

    // Format data for radar chart (top 6 actions)
    const sortedActions = Object.entries(actionUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    const actionUsageData = sortedActions.map(([actionId, count]) => ({
      action: formatActionId(actionId as TActionID),
      count
    }))

    // Calculate success rate for radial chart
    const totalExecutions = totalCompleted + totalFailed
    const successRate =
      totalExecutions > 0
        ? Math.round((totalCompleted / totalExecutions) * 100)
        : 0

    return {
      executionsOverTime,
      actionUsageData,
      successRate: {
        rate: successRate,
        total: totalExecutions,
        completed: totalCompleted,
        failed: totalFailed
      }
    }
  })
}

function formatActionId(actionId: TActionID) {
  return actionId.replace(/_/g, ' ')
}
