import type { Node, Edge, XYPosition } from '@xyflow/react'
import { ALL_NODE_TYPES, TRIGGER_NODE_TYPES, NODE_TYPES } from '@/constants'
import { ValueOf } from '@/types/index.types'
import { TRIGGER_ACTION_ID } from '@shared/constants'

/**
 * Default edge styling constants used throughout the application
 */
export const DEFAULT_EDGE_STYLE = {
  strokeWidth: 2,
  stroke: '#9ca3af'
} as const

export const DEFAULT_EDGE_MARKER_END = {
  type: 'arrowclosed' as const,
  color: '#9ca3af',
  width: 12,
  height: 12
} as const

/**
 * Default edge options for ReactFlow component
 */
export const DEFAULT_EDGE_OPTIONS = {
  type: 'bezier' as const,
  style: DEFAULT_EDGE_STYLE,
  markerEnd: DEFAULT_EDGE_MARKER_END
} as const

/**
 * Generates a unique node ID using timestamp and random string
 */
export function generateNodeId(): string {
  return `n${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Generates a unique edge ID from source and target node IDs
 */
export function generateEdgeId(sourceId: string, targetId: string): string {
  return `e${sourceId}-${targetId}`
}

/**
 * Check if a node type is a trigger node
 */
export function isTriggerNodeType(
  nodeType: string
): nodeType is ValueOf<typeof TRIGGER_NODE_TYPES> {
  return Object.values(TRIGGER_NODE_TYPES).includes(
    nodeType as ValueOf<typeof TRIGGER_NODE_TYPES>
  )
}

/**
 * Check if a node type is a condition node
 */
export function isConditionNodeType(nodeType: string): boolean {
  return nodeType === NODE_TYPES.CONDITION
}

/**
 * Get the trigger action ID for a trigger node type
 */
function getTriggerActionId(
  nodeType: ValueOf<typeof TRIGGER_NODE_TYPES>
): string {
  switch (nodeType) {
    case TRIGGER_NODE_TYPES.MANUAL_TRIGGER:
      return TRIGGER_ACTION_ID.MANUAL_TRIGGER
    case TRIGGER_NODE_TYPES.GMAIL_WEBHOOK_TRIGGER:
      return TRIGGER_ACTION_ID.GMAIL_WEBHOOK_TRIGGER
    case TRIGGER_NODE_TYPES.DISCORD_WEBHOOK_TRIGGER:
      return TRIGGER_ACTION_ID.DISCORD_WEBHOOK_TRIGGER
    case TRIGGER_NODE_TYPES.SCHEDULE_TRIGGER:
      return TRIGGER_ACTION_ID.SCHEDULE_TRIGGER
    default:
      return ''
  }
}

/**
 * Creates a new edge with default styling
 */
export function createEdge(
  sourceId: string,
  targetId: string,
  options?: {
    id?: string
    type?: string
    style?: Partial<typeof DEFAULT_EDGE_STYLE>
    markerEnd?: Partial<typeof DEFAULT_EDGE_MARKER_END>
  }
): Edge {
  return {
    id: options?.id || generateEdgeId(sourceId, targetId),
    source: sourceId,
    target: targetId,
    type: options?.type || 'default',
    style: {
      ...DEFAULT_EDGE_STYLE,
      ...options?.style
    },
    markerEnd: {
      ...DEFAULT_EDGE_MARKER_END,
      ...options?.markerEnd
    }
  }
}

/**
 * Creates a new node with the specified type and position
 * Trigger nodes are auto-configured with their actionId and empty config
 */
export function createNode(
  nodeType: ValueOf<typeof ALL_NODE_TYPES>,
  position: XYPosition,
  options?: {
    id?: string
    type?: string
  }
): Node {
  // Determine the node type based on whether it's a trigger, condition, or action
  const isTrigger = isTriggerNodeType(nodeType)
  const isCondition = isConditionNodeType(nodeType)

  let reactFlowNodeType = 'custom_node'
  if (isTrigger) {
    reactFlowNodeType = 'trigger_node'
  } else if (isCondition) {
    reactFlowNodeType = 'condition_node'
  }

  // Build node data - auto-configure trigger nodes
  const nodeData: Record<string, any> = {
    type: nodeType
  }

  // Auto-configure trigger nodes with their actionId and empty config
  if (isTrigger) {
    nodeData.actionId = getTriggerActionId(
      nodeType as ValueOf<typeof TRIGGER_NODE_TYPES>
    )
    nodeData.config = {}
  }

  return {
    id: options?.id || generateNodeId(),
    type: options?.type || reactFlowNodeType,
    position,
    data: nodeData
  }
}

/**
 * Finds the last node in a chain (node with no outgoing edges)
 * If multiple such nodes exist, returns the rightmost one
 */
export function findLastNode(nodes: Node[], edges: Edge[]): Node | null {
  const nodesWithNoOutgoing = nodes.filter(
    (node) => !edges.some((edge) => edge.source === node.id)
  )

  if (nodesWithNoOutgoing.length === 0) {
    return null
  }

  // Return the rightmost node
  return nodesWithNoOutgoing.reduce((prev, curr) =>
    curr.position.x > prev.position.x ? curr : prev
  )
}

/**
 * Finds the rightmost node in the nodes array
 */
export function findRightmostNode(nodes: Node[]): Node | null {
  if (nodes.length === 0) {
    return null
  }

  return nodes.reduce((prev, curr) =>
    curr.position.x > prev.position.x ? curr : prev
  )
}

/**
 * Calculates position for a new node based on existing nodes
 * @param nodes - Array of existing nodes
 * @param edges - Array of existing edges
 * @param offsetX - Horizontal offset from the previous node (default: 250)
 * @param offsetY - Vertical offset from the previous node (default: 0)
 * @param baseY - Base Y position when no nodes exist (default: 160)
 * @param baseX - Base X position when no nodes exist (default: 280)
 */
export function calculateNewNodePosition(
  nodes: Node[],
  edges: Edge[],
  options?: {
    offsetX?: number
    offsetY?: number
    baseY?: number
    baseX?: number
    fromNode?: Node | null
  }
): XYPosition {
  const offsetX = options?.offsetX ?? 250
  const offsetY = options?.offsetY ?? 0
  const baseY = options?.baseY ?? 160
  const baseX = options?.baseX ?? 280

  // If a specific node is provided, position relative to it
  if (options?.fromNode) {
    return {
      x: options.fromNode.position.x + offsetX,
      y: options.fromNode.position.y + offsetY
    }
  }

  // Try to find the last node in the chain
  const lastNode = findLastNode(nodes, edges)
  if (lastNode) {
    return {
      x: lastNode.position.x + offsetX,
      y: lastNode.position.y + offsetY
    }
  }

  // If no last node but nodes exist, use the rightmost node
  if (nodes.length > 0) {
    const rightmostNode = findRightmostNode(nodes)
    if (rightmostNode) {
      return {
        x: rightmostNode.position.x + offsetX,
        y: rightmostNode.position.y + offsetY
      }
    }
  }

  // Default position when no nodes exist
  return { x: baseX, y: baseY }
}

/**
 * Formats edges with default styling (useful when loading from API)
 */
export function formatEdges(edges: any[]): Edge[] {
  return edges.map((edge: any) => ({
    ...edge,
    style: {
      ...DEFAULT_EDGE_STYLE,
      ...edge.style
    },
    markerEnd: {
      ...DEFAULT_EDGE_MARKER_END,
      ...edge.markerEnd
    }
  }))
}

/**
 * Formats nodes to ensure they have the correct type (useful when loading from API)
 */
export function formatNodes(nodes: any[]): Node[] {
  return nodes.map((node: any) => {
    // Determine the correct node type based on the data.type
    const nodeDataType = node.data?.type

    let reactFlowNodeType = 'custom_node'
    if (nodeDataType && isTriggerNodeType(nodeDataType)) {
      reactFlowNodeType = 'trigger_node'
    } else if (nodeDataType && isConditionNodeType(nodeDataType)) {
      reactFlowNodeType = 'condition_node'
    }

    const normalizedType =
      node.type === 'ai_node' || node.type === 'http_node'
        ? 'custom_node'
        : node.type

    return {
      ...node,
      type: normalizedType || reactFlowNodeType
    }
  })
}
