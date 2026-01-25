'use client'

// Types for node execution data stored in node.data
export type NodeOutputData = {
  nodeId: string
  actionId: string
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
  variables: NodeVariable[]
}

// Helper to flatten an object into variable paths
export const flattenObject = (
  obj: Record<string, any>,
  prefix = ''
): NodeVariable[] => {
  const result: NodeVariable[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      result.push(...flattenObject(value, fullPath))
    } else if (Array.isArray(value)) {
      // For arrays, add the array itself
      result.push({
        key,
        value: `[Array of ${value.length} items]`,
        path: fullPath
      })
      // Also add first item properties if it's an array of objects
      if (value.length > 0 && typeof value[0] === 'object') {
        result.push(...flattenObject(value[0], `${fullPath}[0]`))
      }
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
      actionId?: string
      lastOutput?: Record<string, any>
    }
  }>
): NodeInputSource[] => {
  const predecessorIds = findPredecessorNodes(currentNodeId, edges)

  return predecessorIds
    .map((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)

      if (!node || !node.data.lastOutput) return null

      return {
        nodeId,
        nodeType: node.data.type,
        variables: flattenObject(node.data.lastOutput)
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}
