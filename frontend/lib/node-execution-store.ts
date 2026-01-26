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
  actionId?: string
  variables: NodeVariable[]
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

      // If there are more items, add a hint
      if (value.length > maxArrayItems) {
        result.push({
          key: 'more',
          value: `... ${value.length - maxArrayItems} more items available`,
          path: `${fullPath}[${maxArrayItems}]` // Placeholder for continuation
        })
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
        actionId: node.data.actionId,
        variables: flattenObject(node.data.lastOutput)
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}
