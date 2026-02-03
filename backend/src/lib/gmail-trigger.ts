import { prisma } from '@shared/db/prisma'
import { TRIGGER_ACTION_ID } from '@shared/constants'
import { executeWorkflowById } from './workflow-executor'
import { extractGmailMessageContent } from '@/src/helper/gmail-helper'
import { API_ROUTES } from '@/src/constants'

type GmailTriggerConfig = {
  credentialId?: string
  labelId?: string
  markAsRead?: boolean
  includeBody?: boolean
  includeAttachments?: boolean
}

type GmailEmailData = {
  id: string
  threadId?: string
  from?: string
  to?: string
  subject?: string
  date?: string
  snippet?: string
  body?: string
  attachments?: {
    filename: string
    mimeType: string
    data: string
  }[]
  labelIds?: string[]
}

export async function triggerGmailWorkflows(
  userId: string,
  credentialId: string,
  accessToken: string,
  message: any,
  emailData: GmailEmailData
): Promise<void> {
  const workflows = await prisma.workflow.findMany({
    where: {
      authorId: userId,
      isActive: true
    },
    select: {
      id: true,
      nodes: true
    }
  })

  for (const workflow of workflows) {
    const nodes = workflow.nodes as any[]
    const triggerNode = nodes.find(
      (node) => node?.data?.actionId === TRIGGER_ACTION_ID.GMAIL_WEBHOOK_TRIGGER
    )

    if (!triggerNode?.data?.config) continue

    const config = triggerNode.data.config as GmailTriggerConfig
    if (config.credentialId && config.credentialId !== credentialId) continue

    if (
      config.labelId &&
      emailData.labelIds &&
      !emailData.labelIds.includes(config.labelId)
    ) {
      continue
    }

    let body: string | undefined
    let attachments: GmailEmailData['attachments']

    if (config.includeBody || config.includeAttachments) {
      const content = await extractGmailMessageContent(
        message.id,
        message.payload,
        accessToken
      )

      if (config.includeBody) {
        body = content.body
      }

      if (config.includeAttachments) {
        attachments = content.attachments
      }
    }

    if (config.markAsRead) {
      try {
        await fetch(API_ROUTES.GMAIL.MODIFY_MESSAGE(message.id), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            removeLabelIds: ['UNREAD']
          })
        })
      } catch {
        // Best-effort: don't block workflow execution.
      }
    }

    await executeWorkflowById(workflow.id, {
      ...emailData,
      ...(body ? { body } : {}),
      ...(attachments ? { attachments } : {}),
      triggeredBy: 'gmail_webhook'
    })
  }
}
