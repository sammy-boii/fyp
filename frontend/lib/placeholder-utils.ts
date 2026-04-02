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
 * Check if the value is a canonical placeholder token: {{nodeId.path}}
 */
export const isCanonicalPlaceholder = (value: string): boolean => {
  return /^\{\{[^}]+\}\}$/.test(value.trim())
}

/**
 * Split text into a leading canonical placeholder token and the remaining suffix.
 * Example: "{{node.path}}-suffix" => { token: "{{node.path}}", remainder: "-suffix" }
 */
export const extractLeadingCanonicalPlaceholder = (
  value: string
): { token: string | null; remainder: string } => {
  const match = value.match(/^(\{\{[^}]+\}\})([\s\S]*)$/)
  if (!match) {
    return { token: null, remainder: value }
  }

  return {
    token: match[1],
    remainder: match[2]
  }
}

/**
 * Split text into all contiguous leading canonical placeholder tokens and
 * the remaining suffix.
 * Example: "{{a.x}}{{b.y}}-suffix" =>
 *   { tokens: ["{{a.x}}", "{{b.y}}"], remainder: "-suffix" }
 */
export const extractLeadingCanonicalPlaceholders = (
  value: string
): { tokens: string[]; remainder: string } => {
  const tokens: string[] = []
  let remainder = value

  while (true) {
    const match = remainder.match(/^(\{\{[^}]+\}\})/)
    if (!match) break

    tokens.push(match[1])
    remainder = remainder.slice(match[1].length)
  }

  return { tokens, remainder }
}

/**
 * Convert canonical placeholder text into a friendly display string for UI
 * controls that do not support rich placeholder chips.
 */
export const formatPlaceholderForDisplay = (
  value: string,
  resolveNodeLabel: (nodeId: string) => string
): string => {
  const trimmed = value.trim()
  if (!isCanonicalPlaceholder(trimmed)) {
    return value
  }

  const content = trimmed.slice(2, -2).trim()
  const dotIndex = content.indexOf('.')
  if (dotIndex === -1) {
    return value
  }

  const nodeId = content.substring(0, dotIndex)
  const path = content.substring(dotIndex + 1)
  return `${resolveNodeLabel(nodeId)}.${path}`
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
