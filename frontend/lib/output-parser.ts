'use client'

import { NODE_ACTION_ID } from '@shared/constants'

// Types for parsed output data
export type ParsedOutputField = {
  key: string
  label: string
  value: any
  path: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'unknown'
  description?: string
  isExpandable: boolean
  arrayLength?: number
  children?: ParsedOutputField[]
}

export type ParsedOutput = {
  actionId: string
  fields: ParsedOutputField[]
  summary?: string
}

/**
 * Determine the type of a value
 */
export const getValueType = (value: any): ParsedOutputField['type'] => {
  if (value === null) return 'null'
  if (value === undefined) return 'null'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return 'unknown'
}

/**
 * Create a human-readable label from a key
 */
export const keyToLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

/**
 * Parse an array field and extract its structure
 */
const parseArrayField = (
  key: string,
  value: any[],
  basePath: string
): ParsedOutputField => {
  const path = basePath ? `${basePath}.${key}` : key
  const children: ParsedOutputField[] = []

  // Add array-level operations
  children.push({
    key: 'length',
    label: 'Length',
    value: value.length,
    path: `${path}.length`,
    type: 'number',
    isExpandable: false,
    description: 'Number of items in the array'
  })

  // If array has items, parse the first item's structure
  if (value.length > 0) {
    const firstItem = value[0]
    
    // For arrays of objects, show the structure of items
    if (typeof firstItem === 'object' && firstItem !== null) {
      // Add individual array items (show first 3)
      const itemsToShow = Math.min(value.length, 3)
      for (let i = 0; i < itemsToShow; i++) {
        const itemPath = `${path}[${i}]`
        const itemChildren = parseObjectToFields(value[i], itemPath)
        
        children.push({
          key: `[${i}]`,
          label: `Item ${i + 1}`,
          value: value[i],
          path: itemPath,
          type: 'object',
          isExpandable: true,
          children: itemChildren
        })
      }

      // If there are more items, indicate it
      if (value.length > 3) {
        children.push({
          key: 'more',
          label: `... and ${value.length - 3} more items`,
          value: null,
          path: '',
          type: 'null',
          isExpandable: false,
          description: 'Use array index notation to access more items'
        })
      }
    } else {
      // For arrays of primitives, show first few values
      const itemsToShow = Math.min(value.length, 5)
      for (let i = 0; i < itemsToShow; i++) {
        children.push({
          key: `[${i}]`,
          label: `Item ${i + 1}`,
          value: value[i],
          path: `${path}[${i}]`,
          type: getValueType(value[i]),
          isExpandable: false
        })
      }
    }
  }

  return {
    key,
    label: keyToLabel(key),
    value,
    path,
    type: 'array',
    isExpandable: true,
    arrayLength: value.length,
    children
  }
}

/**
 * Parse an object's fields recursively
 */
const parseObjectToFields = (
  obj: Record<string, any>,
  basePath: string = ''
): ParsedOutputField[] => {
  const fields: ParsedOutputField[] = []

  for (const [key, value] of Object.entries(obj)) {
    const path = basePath ? `${basePath}.${key}` : key
    const type = getValueType(value)

    if (type === 'array') {
      fields.push(parseArrayField(key, value, basePath))
    } else if (type === 'object' && value !== null) {
      const children = parseObjectToFields(value, path)
      fields.push({
        key,
        label: keyToLabel(key),
        value,
        path,
        type: 'object',
        isExpandable: true,
        children
      })
    } else {
      fields.push({
        key,
        label: keyToLabel(key),
        value,
        path,
        type,
        isExpandable: false
      })
    }
  }

  return fields
}

/**
 * Parse READ_EMAIL action output
 */
const parseReadEmailOutput = (output: Record<string, any>): ParsedOutput => {
  const fields: ParsedOutputField[] = []
  const emails = output.emails || []
  const count = output.count || 0
  const query = output.query || ''

  // Add count field
  fields.push({
    key: 'count',
    label: 'Email Count',
    value: count,
    path: 'count',
    type: 'number',
    isExpandable: false,
    description: 'Total number of emails returned'
  })

  // Add query field
  fields.push({
    key: 'query',
    label: 'Search Query',
    value: query,
    path: 'query',
    type: 'string',
    isExpandable: false,
    description: 'The search query used to find emails'
  })

  // Parse emails array with better structure
  if (emails.length > 0) {
    const emailsField: ParsedOutputField = {
      key: 'emails',
      label: 'Emails',
      value: emails,
      path: 'emails',
      type: 'array',
      isExpandable: true,
      arrayLength: emails.length,
      children: []
    }

    // Add each email with its fields
    emails.forEach((email: any, index: number) => {
      const emailPath = `emails[${index}]`
      const emailFields: ParsedOutputField[] = [
        {
          key: 'id',
          label: 'Message ID',
          value: email.id,
          path: `${emailPath}.id`,
          type: 'string',
          isExpandable: false
        },
        {
          key: 'subject',
          label: 'Subject',
          value: email.subject,
          path: `${emailPath}.subject`,
          type: 'string',
          isExpandable: false
        },
        {
          key: 'from',
          label: 'From',
          value: email.from,
          path: `${emailPath}.from`,
          type: 'string',
          isExpandable: false
        },
        {
          key: 'to',
          label: 'To',
          value: email.to,
          path: `${emailPath}.to`,
          type: 'string',
          isExpandable: false
        },
        {
          key: 'date',
          label: 'Date',
          value: email.date,
          path: `${emailPath}.date`,
          type: 'string',
          isExpandable: false
        },
        {
          key: 'snippet',
          label: 'Snippet',
          value: email.snippet,
          path: `${emailPath}.snippet`,
          type: 'string',
          isExpandable: false
        },
        {
          key: 'body',
          label: 'Body',
          value: email.body,
          path: `${emailPath}.body`,
          type: 'string',
          isExpandable: true
        },
        {
          key: 'attachmentCount',
          label: 'Attachments',
          value: email.attachmentCount,
          path: `${emailPath}.attachmentCount`,
          type: 'number',
          isExpandable: false
        }
      ]

      emailsField.children!.push({
        key: `[${index}]`,
        label: email.subject || `Email ${index + 1}`,
        value: email,
        path: emailPath,
        type: 'object',
        isExpandable: true,
        children: emailFields
      })
    })

    fields.push(emailsField)
  }

  return {
    actionId: NODE_ACTION_ID.READ_EMAIL,
    fields,
    summary: `Found ${count} email(s)${query !== 'all' ? ` matching "${query}"` : ''}`
  }
}

/**
 * Parse SEND_EMAIL action output
 */
const parseSendEmailOutput = (output: Record<string, any>): ParsedOutput => {
  const fields: ParsedOutputField[] = []

  fields.push({
    key: 'messageId',
    label: 'Message ID',
    value: output.messageId,
    path: 'messageId',
    type: 'string',
    isExpandable: false,
    description: 'Unique ID of the sent message'
  })

  fields.push({
    key: 'to',
    label: 'Recipient',
    value: output.to,
    path: 'to',
    type: 'string',
    isExpandable: false
  })

  fields.push({
    key: 'subject',
    label: 'Subject',
    value: output.subject,
    path: 'subject',
    type: 'string',
    isExpandable: false
  })

  if (output.message) {
    fields.push({
      key: 'message',
      label: 'Status Message',
      value: output.message,
      path: 'message',
      type: 'string',
      isExpandable: false
    })
  }

  return {
    actionId: NODE_ACTION_ID.SEND_EMAIL,
    fields,
    summary: `Email sent to ${output.to}`
  }
}

/**
 * Main function to parse node output based on action type
 */
export const parseNodeOutput = (
  actionId: string | undefined,
  output: Record<string, any>
): ParsedOutput => {
  switch (actionId) {
    case NODE_ACTION_ID.READ_EMAIL:
      return parseReadEmailOutput(output)
    case NODE_ACTION_ID.SEND_EMAIL:
      return parseSendEmailOutput(output)
    default:
      // Generic parsing for unknown action types
      return {
        actionId: actionId || 'unknown',
        fields: parseObjectToFields(output),
        summary: undefined
      }
  }
}

/**
 * Get available placeholder paths for an action's output
 * This is useful for showing what variables can be used in subsequent nodes
 */
export const getAvailablePlaceholders = (
  actionId: string | undefined,
  output: Record<string, any>
): Array<{ path: string; label: string; type: string }> => {
  const placeholders: Array<{ path: string; label: string; type: string }> = []

  const traverseFields = (fields: ParsedOutputField[]) => {
    for (const field of fields) {
      // Add the field itself
      placeholders.push({
        path: field.path,
        label: field.label,
        type: field.type
      })

      // Recursively add children
      if (field.children) {
        traverseFields(field.children)
      }
    }
  }

  const parsed = parseNodeOutput(actionId, output)
  traverseFields(parsed.fields)

  return placeholders
}

/**
 * Format value for display based on type
 */
export const formatValueByType = (value: any, type: ParsedOutputField['type']): string => {
  switch (type) {
    case 'null':
      return 'null'
    case 'boolean':
      return String(value)
    case 'number':
      return String(value)
    case 'string':
      if (value.length > 100) {
        return `${value.substring(0, 100)}...`
      }
      return value
    case 'array':
      return `Array [${(value as any[]).length} items]`
    case 'object':
      const keys = Object.keys(value || {})
      return `Object {${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''}}`
    default:
      return String(value)
  }
}
