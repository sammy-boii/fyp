// Placeholder utilities for the node input/output system
// Types are exported from node-execution-store.ts

export type PlaceholderMatch = {
  fullMatch: string
  nodeId: string
  path: string
}

// Placeholder format: {{nodeId.path}} or just {{path}} for implicit previous node
export const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g

/**
 * Parse a string and extract all placeholder matches
 */
export const extractPlaceholders = (text: string): PlaceholderMatch[] => {
  const matches: PlaceholderMatch[] = []
  let match: RegExpExecArray | null

  while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
    const content = match[1].trim()
    const dotIndex = content.indexOf('.')

    if (dotIndex !== -1) {
      matches.push({
        fullMatch: match[0],
        nodeId: content.substring(0, dotIndex),
        path: content.substring(dotIndex + 1)
      })
    } else {
      // If no dot, assume it's a path from the immediate previous node
      matches.push({
        fullMatch: match[0],
        nodeId: '',
        path: content
      })
    }
  }

  return matches
}

/**
 * Get a value from an object using a dot-notation path
 */
export const getValueByPath = (obj: Record<string, any>, path: string): any => {
  const parts = path.split(/[.[\]]+/).filter(Boolean)
  let current = obj

  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = current[part]
  }

  return current
}

/**
 * Replace placeholders in text with actual values from node outputs
 */
export const replacePlaceholders = (
  text: string,
  nodeOutputs: Map<string, { output: Record<string, any> }>,
  defaultNodeId?: string
): string => {
  return text.replace(PLACEHOLDER_REGEX, (fullMatch, content) => {
    const trimmedContent = content.trim()
    const dotIndex = trimmedContent.indexOf('.')

    let nodeId: string
    let path: string

    if (dotIndex !== -1) {
      nodeId = trimmedContent.substring(0, dotIndex)
      path = trimmedContent.substring(dotIndex + 1)
    } else {
      nodeId = defaultNodeId || ''
      path = trimmedContent
    }

    const nodeOutput = nodeOutputs.get(nodeId)
    if (!nodeOutput) return fullMatch

    const value = getValueByPath(nodeOutput.output, path)
    if (value === undefined) return fullMatch

    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  })
}

/**
 * Create a placeholder string for a variable
 */
export const createPlaceholder = (nodeId: string, path: string): string => {
  return `{{${nodeId}.${path}}}`
}

/**
 * Format a value for display in the UI
 */
export const formatValueForDisplay = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') {
    return value.length > 50 ? `${value.substring(0, 50)}...` : value
  }
  if (typeof value === 'object') {
    return Array.isArray(value) ? `[Array: ${value.length} items]` : '[Object]'
  }
  return String(value)
}
