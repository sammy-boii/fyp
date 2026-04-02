'use client'

import { NODE_ACTION_ID, TRIGGER_ACTION_ID, TActionID } from '@shared/constants'

// Types for node execution data stored in node.data
export type NodeOutputData = {
  nodeId: string
  actionId: TActionID
  output: Record<string, any>
  executedAt: Date
  isInferred?: boolean
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

export const createInferredOutputForAction = (
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
        id: 'message_id',
        threadId: 'thread_id',
        from: 'Sender Name <sender@example.com>',
        to: 'Recipient Name <recipient@example.com>',
        subject: 'Subject',
        snippet: 'Message snippet',
        body: 'Message body',
        date: 'Wed, 1 Apr 2026 23:24:16 +0545',
        labelIds: ['UNREAD', 'INBOX', 'IMPORTANT'],
        attachments: [
          {
            filename: 'file.txt',
            mimeType: 'application/octet-stream',
            data: 'base64_data_here'
          }
        ],
        triggeredBy: 'gmail_webhook'
      }

    case TRIGGER_ACTION_ID.DISCORD_WEBHOOK_TRIGGER:
      return {
        messageId: 'message_id',
        guildId: 'guild_id',
        guildName: 'My Server',
        channelId: 'channel_id',
        channelName: 'general',
        authorId: 'author_id',
        authorUsername: 'username',
        authorTag: 'username',
        content: 'Message content',
        timestamp: '2026-04-01T17:44:29.149Z',
        attachments: [
          {
            name: 'file.txt',
            url: 'https://cdn.discordapp.com/attachments/.../file.txt',
            contentType: null
          }
        ]
      }

    case TRIGGER_ACTION_ID.SCHEDULE_TRIGGER:
      return {
        triggered: true,
        type: 'schedule',
        schedule: {
          date: '2026-01-01',
          loop: false,
          time: '09:00',
          timezone: 'UTC'
        },
        event: null
      }

    case NODE_ACTION_ID.GMAIL.SEND_EMAIL:
      return {
        messageId: 'message_id',
        threadId: 'thread_id',
        labelIds: ['SENT'],
        to: 'recipient@example.com',
        cc: 'cc1@example.com,cc2@example.com',
        bcc: 'bcc@example.com',
        subject: 'Subject',
        body: 'Body',
        attachmentCount: 1
      }

    case NODE_ACTION_ID.GMAIL.READ_EMAIL:
      return {
        count: 5,
        folder: 'INBOX',
        emails: [
          {
            id: 'message_id',
            threadId: 'thread_id',
            subject: 'Subject',
            from: 'sender@example.com',
            to: 'recipient@example.com',
            date: 'Mon, 30 Mar 2026 06:52:15 +0000 (GMT)',
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
          },
          {
            id: 'message_id_2',
            threadId: 'thread_id_2',
            subject: 'Another Subject',
            from: 'another.sender@example.com',
            to: 'recipient@example.com',
            date: 'Tue, 31 Mar 2026 10:20:00 +0000 (GMT)',
            snippet: 'Another message snippet',
            body: 'Plain text body',
            attachments: [],
            attachmentCount: 0
          }
        ]
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
        count: 3,
        guilds: [
          {
            id: 'guild_id_1',
            name: 'Server One',
            icon: 'https://cdn.discordapp.com/icons/...png',
            owner: false,
            permissions: '9007199254740991'
          },
          {
            id: 'guild_id_2',
            name: 'Server Two',
            icon: null,
            owner: false,
            permissions: '9007199254740991'
          }
        ]
      }

    case NODE_ACTION_ID.DISCORD.LIST_CHANNELS:
      return {
        count: 8,
        channels: [
          {
            id: 'category_id_1',
            name: 'Text Channels',
            type: 'category',
            position: 0,
            parentId: null
          },
          {
            id: 'category_id_2',
            name: 'Voice Channels',
            type: 'category',
            position: 0,
            parentId: null
          },
          {
            id: 'text_channel_id_1',
            name: 'general',
            type: 'text',
            position: 1,
            parentId: 'category_id_1',
            topic: null
          },
          {
            id: 'voice_channel_id_1',
            name: 'General Voice',
            type: 'voice',
            position: 0,
            parentId: 'category_id_2'
          },
          {
            id: 'text_channel_id_2',
            name: 'bots-stuff',
            type: 'text',
            position: 2,
            parentId: 'category_id_1',
            topic: null
          }
        ]
      }

    case NODE_ACTION_ID.DISCORD.CREATE_CHANNEL:
      return {
        id: 'channel_id',
        name: 'new-channel',
        type: 'text',
        guildId: 'guild_id',
        position: 4,
        parentId: null,
        topic: 'This is a test channel'
      }

    case NODE_ACTION_ID.CONDITION.EVALUATE_CONDITION:
      return {
        result: true,
        branchTaken: 'true',
        matchType: 'all | any',
        conditionResults: [
          {
            condition: {
              field: 'field_1',
              operator: 'equals',
              value: 'value_1'
            },
            result: true
          },
          {
            condition: {
              field: 'field_2',
              operator: 'greater_than',
              value: 'value_2'
            },
            result: false
          },
          {
            condition: {
              field: 'field_3',
              operator: 'is_empty',
              value: 'value_3'
            },
            result: false
          }
        ]
      }

    case NODE_ACTION_ID.AI.ASK_AI:
      return {
        answer: 'Generated answer',
        explanation: 'Explanation of the generated answer',
        confidence: 'high | medium | low',
        details: {}
      }

    case NODE_ACTION_ID.HTTP.HTTP_REQUEST:
      return {
        status: 200,
        statusText: 'OK',
        ok: true,
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req_123456'
        },
        body: {
          message: 'Request succeeded',
          data: {
            id: 'resource_id',
            name: 'Sample Resource'
          }
        },
        url: 'https://api.example.com/resource',
        duration: 120,
        request: {
          method: 'GET',
          url: 'https://api.example.com/resource',
          headers: {
            Authorization: 'Bearer <token>'
          },
          query: {
            limit: 10,
            page: 1
          },
          body: null
        }
      }

    default:
      return undefined
  }
}

export const isOutputEmpty = (output?: Record<string, any>): boolean => {
  if (!output) return true
  return Object.keys(output).length === 0
}

const normalizeOutputRecord = (value: any): Record<string, any> => {
  if (value !== null && typeof value === 'object') {
    return value as Record<string, any>
  }

  return { value }
}

export const resolveOutputWithInference = (
  actionId?: TActionID,
  lastOutput?: any
): { output?: Record<string, any>; isInferred: boolean } => {
  const inferredOutput = createInferredOutputForAction(actionId)

  const hasConcreteOutput = lastOutput !== undefined && lastOutput !== null

  if (hasConcreteOutput) {
    return { output: normalizeOutputRecord(lastOutput), isInferred: false }
  }

  if (!inferredOutput) {
    return { output: undefined, isInferred: false }
  }

  return { output: inferredOutput, isInferred: true }
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

      const { output, isInferred } = resolveOutputWithInference(
        node.data.actionId,
        node.data.lastOutput
      )

      if (!output) return null

      return {
        nodeId,
        nodeType: node.data.type,
        actionId: node.data.actionId,
        variables: flattenObject(output),
        rawOutput: output,
        isInferred
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}
