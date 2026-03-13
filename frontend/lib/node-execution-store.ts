'use client'

import { NODE_ACTION_ID, TRIGGER_ACTION_ID, TActionID } from '@shared/constants'

// Types for node execution data stored in node.data
export type NodeOutputData = {
  nodeId: string
  actionId: TActionID
  output: Record<string, any>
  executedAt: Date
}

export type NodeVariable = {
  key: string
  value: any
  path: string
}

export type NodeInputSource = {
  nodeId: string
  nodeType: string
  nodeLabel?: string
  actionId?: TActionID
  variables: NodeVariable[]
  rawOutput?: Record<string, any>
  isInferred?: boolean
}

const createInferredOutputForAction = (
  actionId?: TActionID
): Record<string, any> | undefined => {
  if (!actionId) return undefined

  switch (actionId) {
    case TRIGGER_ACTION_ID.MANUAL_TRIGGER:
      return {
        triggered: true,
        type: 'manual'
      }

    case TRIGGER_ACTION_ID.GMAIL_WEBHOOK_TRIGGER:
      return {
        triggered: true,
        type: 'gmail_webhook',
        email: {
          id: 'message_id',
          threadId: 'thread_id',
          from: 'sender@example.com',
          to: 'recipient@example.com',
          subject: 'Subject',
          snippet: 'Message snippet',
          body: 'Message body',
          date: '2026-03-13T00:00:00.000Z'
        }
      }

    case TRIGGER_ACTION_ID.DISCORD_WEBHOOK_TRIGGER:
      return {
        triggered: true,
        type: 'discord_webhook',
        message: {
          id: 'message_id',
          guildId: 'guild_id',
          channelId: 'channel_id',
          authorId: 'author_id',
          content: 'Message content',
          timestamp: '2026-03-13T00:00:00.000Z'
        }
      }

    case TRIGGER_ACTION_ID.SCHEDULE_TRIGGER:
      return {
        triggered: true,
        type: 'schedule',
        schedule: {
          startDate: '2026-03-13',
          time: '09:00',
          timezone: 'UTC',
          repeat: 'daily'
        },
        event: {
          triggeredAt: '2026-03-13T09:00:00.000Z'
        }
      }

    case NODE_ACTION_ID.GMAIL.SEND_EMAIL:
      return {
        messageId: 'message_id',
        threadId: 'thread_id',
        labelIds: ['SENT'],
        to: 'recipient@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Subject',
        body: 'Email body',
        attachmentCount: 1
      }

    case NODE_ACTION_ID.GMAIL.READ_EMAIL:
      return {
        emails: [
          {
            id: 'message_id',
            threadId: 'thread_id',
            subject: 'Subject',
            from: 'sender@example.com',
            to: 'recipient@example.com',
            date: '2026-03-13T00:00:00.000Z',
            snippet: 'Message snippet',
            body: 'Message body',
            attachments: [
              {
                filename: 'attachment.pdf',
                mimeType: 'application/pdf',
                data: 'base64_or_data_url'
              }
            ],
            attachmentCount: 1
          }
        ],
        count: 1,
        folder: 'INBOX'
      }

    case NODE_ACTION_ID.GMAIL.DELETE_EMAIL:
      return {
        messageId: 'message_id',
        trashed: true
      }

    case NODE_ACTION_ID['GOOGLE-DRIVE'].CREATE_FOLDER:
      return {
        folderId: 'folder_id',
        name: 'My Folder',
        webViewLink: 'https://drive.google.com/...',
        message: 'Folder created successfully'
      }

    case NODE_ACTION_ID['GOOGLE-DRIVE'].CREATE_FILE:
      return {
        fileId: 'file_id',
        name: 'document.txt',
        mimeType: 'text/plain',
        size: 1234,
        webViewLink: 'https://drive.google.com/...',
        message: 'File created successfully'
      }

    case NODE_ACTION_ID['GOOGLE-DRIVE'].LIST_FILES:
      return {
        files: [
          {
            id: 'file_id',
            name: 'file.txt',
            mimeType: 'text/plain',
            size: 123,
            createdTime: '2026-03-13T00:00:00.000Z',
            modifiedTime: '2026-03-13T00:00:00.000Z',
            webViewLink: 'https://drive.google.com/...',
            iconLink: 'https://.../icon.png',
            content: 'file content',
            contentType: 'text',
            contentError: null
          }
        ],
        count: 1,
        folderId: 'root',
        fileType: 'all',
        includeContent: false
      }

    case NODE_ACTION_ID['GOOGLE-DRIVE'].DELETE_FILE:
      return {
        fileId: 'file_id',
        message: 'File deleted successfully'
      }

    case NODE_ACTION_ID['GOOGLE-DRIVE'].DELETE_FOLDER:
      return {
        folderId: 'folder_id',
        message: 'Folder deleted successfully'
      }

    case NODE_ACTION_ID.DISCORD.SEND_CHANNEL_MESSAGE:
      return {
        messageId: 'message_id',
        channelId: 'channel_id',
        content: 'Message content',
        timestamp: '2026-03-13T00:00:00.000Z',
        author: {
          id: 'author_id',
          username: 'bot_name'
        }
      }

    case NODE_ACTION_ID.DISCORD.SEND_DM:
      return {
        messageId: 'message_id',
        channelId: 'channel_id',
        recipientId: 'user_id',
        content: 'Message content',
        timestamp: '2026-03-13T00:00:00.000Z'
      }

    case NODE_ACTION_ID.DISCORD.LIST_GUILDS:
      return {
        guilds: [
          {
            id: 'guild_id',
            name: 'My Server',
            icon: 'https://cdn.discordapp.com/icons/...png',
            owner: true,
            permissions: '0'
          }
        ],
        count: 1
      }

    case NODE_ACTION_ID.DISCORD.LIST_CHANNELS:
      return {
        channels: [
          {
            id: 'channel_id',
            name: 'general',
            type: 'text',
            position: 0,
            parentId: null,
            topic: 'Channel topic'
          }
        ],
        count: 1
      }

    case NODE_ACTION_ID.DISCORD.CREATE_CHANNEL:
      return {
        id: 'channel_id',
        name: 'new-channel',
        type: 'text',
        guildId: 'guild_id',
        position: 0,
        parentId: null,
        topic: 'Channel topic'
      }

    case NODE_ACTION_ID.CONDITION.EVALUATE_CONDITION:
      return {
        result: true,
        branchTaken: 'true',
        matchType: 'all',
        conditionResults: [
          {
            condition: {
              field: 'value',
              operator: 'equals',
              value: 'value'
            },
            result: true
          }
        ]
      }

    case NODE_ACTION_ID.AI.ASK_AI:
      return {
        prompt: 'User prompt',
        answer: 'AI answer',
        explanation: 'AI explanation',
        confidence: 'high',
        details: {
          category: 'general'
        },
        questionType: 'analysis',
        fullResponse: {
          answer: 'AI answer',
          explanation: 'AI explanation',
          confidence: 'high',
          data: {
            category: 'general'
          },
          metadata: {
            question_type: 'analysis'
          }
        }
      }

    case NODE_ACTION_ID.HTTP.HTTP_REQUEST:
      return {
        status: 200,
        statusText: 'OK',
        ok: true,
        headers: {
          'content-type': 'application/json'
        },
        body: {
          message: 'Success'
        },
        url: 'https://api.example.com/resource',
        duration: 120,
        request: {
          method: 'GET',
          url: 'https://api.example.com/resource',
          headers: {
            Authorization: 'Bearer token'
          },
          body: ''
        }
      }

    default:
      return undefined
  }
}

// Helper to flatten an object into variable paths
export const flattenObject = (
  obj: Record<string, any>,
  prefix = '',
  maxArrayItems = 5
): NodeVariable[] => {
  const result: NodeVariable[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      result.push(...flattenObject(value, fullPath, maxArrayItems))
    } else if (Array.isArray(value)) {
      // For arrays, add the array itself with length info
      result.push({
        key,
        value: `[Array of ${value.length} items]`,
        path: fullPath
      })

      // Also add array length as a variable
      result.push({
        key: 'length',
        value: value.length,
        path: `${fullPath}.length`
      })

      // Add properties from array items (up to maxArrayItems)
      const itemsToProcess = Math.min(value.length, maxArrayItems)
      for (let i = 0; i < itemsToProcess; i++) {
        const item = value[i]
        if (item !== null && typeof item === 'object') {
          // Flatten each array item's properties
          result.push(...flattenObject(item, `${fullPath}[${i}]`, 2))
        } else {
          // For primitive arrays, add each item
          result.push({
            key: `[${i}]`,
            value: item,
            path: `${fullPath}[${i}]`
          })
        }
      }

      // All items are shown - no limit
    } else {
      result.push({ key, value, path: fullPath })
    }
  }

  return result
}

// Find all predecessor nodes (nodes that come before the current node in the workflow)
export const findPredecessorNodes = (
  currentNodeId: string,
  edges: Array<{ source: string; target: string }>,
  visited = new Set<string>()
): string[] => {
  if (visited.has(currentNodeId)) return []
  visited.add(currentNodeId)

  const predecessors: string[] = []

  for (const edge of edges) {
    if (edge.target === currentNodeId) {
      predecessors.push(edge.source)
      // Recursively find predecessors of predecessors
      predecessors.push(...findPredecessorNodes(edge.source, edges, visited))
    }
  }

  return predecessors
}

/**
 * Get available input variables from predecessor nodes
 * This function works with nodes that have lastOutput stored in their data
 */
export const getAvailableInputsFromNodes = (
  currentNodeId: string,
  edges: Array<{ source: string; target: string }>,
  nodes: Array<{
    id: string
    data: {
      type: string
      actionId?: TActionID
      lastOutput?: Record<string, any>
    }
  }>
): NodeInputSource[] => {
  const predecessorIds = findPredecessorNodes(currentNodeId, edges)

  return predecessorIds
    .map((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return null

      const inferredOutput = createInferredOutputForAction(node.data.actionId)
      const output = node.data.lastOutput ?? inferredOutput

      if (!output) return null

      return {
        nodeId,
        nodeType: node.data.type,
        actionId: node.data.actionId,
        variables: flattenObject(output),
        rawOutput: output,
        isInferred: !node.data.lastOutput
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}
