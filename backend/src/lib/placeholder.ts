import { TWorkflowNode, TWorkflowEdge } from '../types/workflow.types'

// Placeholder format: {{nodeId.path}}
const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g

/**
 * Get a value from an object using a dot-notation path
 * Supports array access like "emails[0].subject"
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
 * Find all predecessor nodes (nodes that come before the current node)
 */
export const findPredecessorNodes = (
  currentNodeId: string,
  edges: TWorkflowEdge[],
  visited = new Set<string>()
): string[] => {
  if (visited.has(currentNodeId)) return []
  visited.add(currentNodeId)

  const predecessors: string[] = []

  for (const edge of edges) {
    if (edge.target === currentNodeId) {
      predecessors.push(edge.source)
      predecessors.push(...findPredecessorNodes(edge.source, edges, visited))
    }
  }

  return predecessors
}

/**
 * Build a map of node outputs from predecessor nodes
 */
export const buildNodeOutputsMap = (
  currentNodeId: string,
  nodes: TWorkflowNode[],
  edges: TWorkflowEdge[]
): Map<string, Record<string, any>> => {
  const predecessorIds = findPredecessorNodes(currentNodeId, edges)
  const outputsMap = new Map<string, Record<string, any>>()

  for (const nodeId of predecessorIds) {
    const node = nodes.find((n) => n.id === nodeId)
    if (node?.data?.lastOutput) {
      outputsMap.set(nodeId, node.data.lastOutput)
    }
  }

  return outputsMap
}

/**
 * Replace placeholders in a string with actual values from node outputs
 */
export const replacePlaceholdersInString = (
  text: string,
  nodeOutputs: Map<string, Record<string, any>>
): string => {
  return text.replace(PLACEHOLDER_REGEX, (fullMatch, content) => {
    const trimmedContent = content.trim()
    const dotIndex = trimmedContent.indexOf('.')

    if (dotIndex === -1) {
      // No dot means invalid placeholder format
      return fullMatch
    }

    const nodeId = trimmedContent.substring(0, dotIndex)
    const path = trimmedContent.substring(dotIndex + 1)

    const nodeOutput = nodeOutputs.get(nodeId)
    if (!nodeOutput) {
      return fullMatch
    }

    const value = getValueByPath(nodeOutput, path)
    if (value === undefined) {
      return fullMatch
    }

    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  })
}

/**
 * Recursively replace placeholders in an object (config)
 */
export const replacePlaceholdersInConfig = (
  config: Record<string, any>,
  nodeOutputs: Map<string, Record<string, any>>
): Record<string, any> => {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      result[key] = replacePlaceholdersInString(value, nodeOutputs)
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === 'string') {
          return replacePlaceholdersInString(item, nodeOutputs)
        } else if (typeof item === 'object' && item !== null) {
          return replacePlaceholdersInConfig(item, nodeOutputs)
        }
        return item
      })
    } else if (typeof value === 'object' && value !== null) {
      result[key] = replacePlaceholdersInConfig(value, nodeOutputs)
    } else {
      result[key] = value
    }
  }

  return result
}
