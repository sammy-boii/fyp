import { Context } from 'hono'
import { generateWithGemini, generateWithHuggingFace } from '../../lib/ai-client'

// Simplified node types for AI to understand
const AVAILABLE_NODES = `
NODE TYPES (use these exact values for "type" field):
- MANUAL_TRIGGER: Starts workflow manually (REQUIRED as first node)
- GMAIL_WEBHOOK_TRIGGER: Triggers on new Gmail emails
- DISCORD_WEBHOOK_TRIGGER: Triggers on Discord events  
- SCHEDULE_TRIGGER: Triggers on a schedule
- GMAIL: Send, read, or delete emails
- GOOGLE_DRIVE: Create folders/files, list files, delete files
- DISCORD: Send messages to channels or DMs
- AI: Ask AI questions or process text
- HTTP: Make HTTP requests to external APIs
- CONDITION: Branch workflow based on conditions

ACTIONS (use these for "actionId" field):
- MANUAL_TRIGGER: actionId = "on_demand"
- GMAIL_WEBHOOK_TRIGGER: actionId = "gmail_webhook"
- DISCORD_WEBHOOK_TRIGGER: actionId = "discord_webhook"
- SCHEDULE_TRIGGER: actionId = "schedule_trigger"
- GMAIL: actionId = "send_email" | "read_email" | "delete_email"
- GOOGLE_DRIVE: actionId = "create_folder" | "create_file" | "list_files" | "delete_file" | "delete_folder"
- DISCORD: actionId = "send_channel_message" | "send_dm" | "list_guilds" | "list_channels" | "create_channel"
- AI: actionId = "ask_ai"
- HTTP: actionId = "http_request"
- CONDITION: actionId = "evaluate_condition"
`

const CONDITION_OPERATORS = `
CONDITION OPERATORS (use these exact values for "operator"):
- equals
- not_equals
- contains
- not_contains
- starts_with
- ends_with
- greater_than
- less_than
- greater_than_or_equal
- less_than_or_equal
- is_empty
- is_not_empty
`

const SYSTEM_PROMPT = `You are a workflow automation assistant that generates React Flow node structures.

${AVAILABLE_NODES}
${CONDITION_OPERATORS}

STRICTNESS:
- If the user's prompt is unclear, nonsensical, or cannot be mapped to the available node types/actions, return ONLY:
  {"error":"Failed to generate workflow"}
- Do NOT output nodes/edges when returning an error.
- Do NOT invent new node types or actionIds.
- If a condition is implied but the condition details are missing, return an error instead of guessing.

OUTPUT FORMAT - Return ONLY valid JSON with this exact structure:
{
  "nodes": [
    {
      "id": "n1",
      "type": "trigger_node" | "custom_node" | "condition_node",
      "position": { "x": number, "y": number },
      "data": {
        "type": "NODE_TYPE_FROM_LIST_ABOVE",
        "actionId": "action_id_from_list_above",
        "config": {}
      }
    }
  ],
  "edges": [
    {
      "id": "e_n1_n2",
      "source": "n1",
      "target": "n2",
      "sourceHandle": "true" | "false"
    }
  ]
}
Note: "sourceHandle" is required ONLY for edges whose source is a CONDITION node; omit it for all other edges.

CONDITION NODE CONFIG:
- data.type must be "CONDITION"
- data.actionId must be "evaluate_condition"
- data.config MUST be:
  {
    "matchType": "all" | "any",
    "conditions": [
      { "field": "<string>", "operator": "<operator>", "value": "<string>" }
    ]
  }
- For operators "is_empty" and "is_not_empty", omit "value".
- If a branch needs multiple actions, chain them in sequence after the condition node.
- Do NOT connect multiple nodes directly from the same condition handle.

COMMON INTENTS:
- "save to google drive" or "save in drive" => type "GOOGLE_DRIVE" with actionId "create_file"
- "reply with ai" => use "AI" (ask_ai) then "GMAIL" (send_email)
- "if ... then ... else ..." => use a "CONDITION" node with true/false branches (edges with sourceHandle)

RULES:
1. ALWAYS start with a trigger node (MANUAL_TRIGGER if not specified)
2. Use "trigger_node" for type when data.type ends with "_TRIGGER"
3. Use "condition_node" for type when data.type is "CONDITION"
4. Use "custom_node" for all other node types
5. Trigger nodes can ONLY appear as the starting node (no other trigger nodes in the flow).
6. Each non-condition node must have at most 1 incoming edge and at most 1 outgoing edge.
7. Condition node rules:
   - It must have at most 1 incoming edge.
   - It may have up to 2 outgoing edges, but ONLY one per handle.
   - "true" handle can connect to ONLY one node.
   - "false" handle can connect to ONLY one node.
8. No loops/cycles are allowed in the graph.
9. All nodes must be connected (no standalone or disconnected nodes).
10. Position nodes horizontally with x increasing by 300 for each step
11. Keep y position around 160 for a straight line layout
12. If there is a condition node, create TWO branches:
   - True branch (sourceHandle "true") goes above (y - 120)
   - False branch (sourceHandle "false") goes below (y + 120)
   - Use sourceHandle ONLY on edges that originate from a condition node
13. Generate unique IDs like "n1", "n2", "n3" etc.
14. Edge IDs should be "e_source_target" format
15. Connect nodes in sequence with edges
16. Return ONLY the JSON, no markdown, no explanation
17. config should be an empty object {} for non-condition nodes
`

interface GeneratedWorkflow {
  nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: {
      type: string
      actionId: string
      config: Record<string, any>
    }
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    sourceHandle?: 'true' | 'false'
  }>
  error?: string
}

const GENERIC_AI_ERROR = 'Failed to generate workflow'

const VALID_NODE_TYPES = new Set([
  'MANUAL_TRIGGER',
  'GMAIL_WEBHOOK_TRIGGER',
  'DISCORD_WEBHOOK_TRIGGER',
  'SCHEDULE_TRIGGER',
  'GMAIL',
  'GOOGLE_DRIVE',
  'DISCORD',
  'AI',
  'HTTP',
  'CONDITION'
])

const VALID_ACTION_IDS = new Set([
  'on_demand',
  'gmail_webhook',
  'discord_webhook',
  'schedule_trigger',
  'send_email',
  'read_email',
  'delete_email',
  'create_folder',
  'create_file',
  'list_files',
  'delete_file',
  'delete_folder',
  'send_channel_message',
  'send_dm',
  'list_guilds',
  'list_channels',
  'create_channel',
  'ask_ai',
  'http_request',
  'evaluate_condition'
])

const ACTION_ID_ALIASES_BY_NODE_TYPE: Record<string, Record<string, string>> = {
  GOOGLE_DRIVE: {
    save_email: 'create_file',
    save_file: 'create_file',
    save_to_drive: 'create_file',
    upload_file: 'create_file',
    upload_to_drive: 'create_file',
    store_file: 'create_file',
    list_drive_files: 'list_files',
    list_files_in_drive: 'list_files',
    delete_drive_file: 'delete_file',
    delete_drive_folder: 'delete_folder',
    create_drive_folder: 'create_folder',
    make_folder: 'create_folder'
  },
  GMAIL: {
    send_mail: 'send_email',
    reply_email: 'send_email',
    reply_to_email: 'send_email',
    read_mail: 'read_email',
    read_emails: 'read_email',
    delete_mail: 'delete_email'
  },
  DISCORD: {
    send_message: 'send_channel_message',
    send_channel_message: 'send_channel_message',
    send_dm_message: 'send_dm'
  },
  AI: {
    ai_prompt: 'ask_ai',
    prompt_ai: 'ask_ai'
  },
  HTTP: {
    call_api: 'http_request',
    request_api: 'http_request',
    make_request: 'http_request'
  }
}

const ACTION_IDS_BY_NODE_TYPE: Record<string, string[]> = {
  MANUAL_TRIGGER: ['on_demand'],
  GMAIL_WEBHOOK_TRIGGER: ['gmail_webhook'],
  DISCORD_WEBHOOK_TRIGGER: ['discord_webhook'],
  SCHEDULE_TRIGGER: ['schedule_trigger'],
  GMAIL: ['send_email', 'read_email', 'delete_email'],
  GOOGLE_DRIVE: [
    'create_folder',
    'create_file',
    'list_files',
    'delete_file',
    'delete_folder'
  ],
  DISCORD: [
    'send_channel_message',
    'send_dm',
    'list_guilds',
    'list_channels',
    'create_channel'
  ],
  AI: ['ask_ai'],
  HTTP: ['http_request'],
  CONDITION: ['evaluate_condition']
}

const VALID_CONDITION_OPERATORS = new Set([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'is_empty',
  'is_not_empty'
])

const OPERATORS_WITHOUT_VALUE = new Set(['is_empty', 'is_not_empty'])

const normalizeActionId = (actionId: string): string =>
  actionId
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_{2,}/g, '_')

const validateAndNormalizeWorkflow = (
  workflow: GeneratedWorkflow
): { workflow?: GeneratedWorkflow; error?: string } => {
  if (workflow?.error && typeof workflow.error === 'string') {
    return { error: workflow.error }
  }

  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    return { error: 'Invalid workflow structure: missing nodes' }
  }

  if (workflow.nodes.length === 0) {
    return { error: 'Invalid workflow structure: no nodes generated' }
  }

  if (!workflow.edges || !Array.isArray(workflow.edges)) {
    workflow.edges = []
  }

  const nodeIds = new Set<string>()
  const conditionNodeIds = new Set<string>()
  const triggerNodeIds = new Set<string>()

  for (const node of workflow.nodes) {
    if (!node?.id || typeof node.id !== 'string') {
      return { error: 'Invalid workflow structure: node id missing' }
    }

    if (nodeIds.has(node.id)) {
      return { error: 'Invalid workflow structure: duplicate node id' }
    }
    nodeIds.add(node.id)

    if (!node?.data || typeof node.data !== 'object') {
      return { error: 'Invalid workflow structure: node data missing' }
    }

    const nodeType = node.data.type
    const rawActionId = node.data.actionId

    if (!nodeType || typeof nodeType !== 'string') {
      return { error: 'Invalid workflow structure: node data.type missing' }
    }

    if (!rawActionId || typeof rawActionId !== 'string') {
      return { error: 'Invalid workflow structure: node data.actionId missing' }
    }

    let actionId = normalizeActionId(rawActionId)

    if (!VALID_NODE_TYPES.has(nodeType)) {
      return { error: `Unsupported node type: ${nodeType}` }
    }

    if (!VALID_ACTION_IDS.has(actionId)) {
      const alias =
        ACTION_ID_ALIASES_BY_NODE_TYPE[nodeType]?.[actionId] || null
      if (alias) {
        actionId = alias
      } else {
        return { error: `Unsupported actionId: ${rawActionId}` }
      }
    }

    const allowedActions = ACTION_IDS_BY_NODE_TYPE[nodeType]
    if (!allowedActions || !allowedActions.includes(actionId)) {
      return {
        error: `ActionId ${rawActionId} is invalid for node type ${nodeType}`
      }
    }

    node.data.actionId = actionId

    if (nodeType.endsWith('_TRIGGER')) {
      triggerNodeIds.add(node.id)
      node.type = 'trigger_node'
    } else if (nodeType === 'CONDITION') {
      node.type = 'condition_node'
      conditionNodeIds.add(node.id)

      const config = node.data.config
      if (!config || typeof config !== 'object') {
        return {
          error:
            'Condition node requires config with matchType and conditions'
        }
      }

      const matchType = config.matchType
      const conditions = config.conditions

      if (matchType !== 'all' && matchType !== 'any') {
        return {
          error:
            'Condition node config.matchType must be "all" or "any"'
        }
      }

      if (!Array.isArray(conditions) || conditions.length === 0) {
        return {
          error:
            'Condition node config.conditions must be a non-empty array'
        }
      }

      for (const condition of conditions) {
        if (!condition?.field || typeof condition.field !== 'string') {
          return { error: 'Condition field must be a non-empty string' }
        }

        const operator = condition.operator
        if (!operator || !VALID_CONDITION_OPERATORS.has(operator)) {
          return { error: `Invalid condition operator: ${operator}` }
        }

        if (!OPERATORS_WITHOUT_VALUE.has(operator)) {
          if (
            condition.value === undefined ||
            condition.value === null ||
            condition.value === ''
          ) {
            return {
              error:
                'Condition value is required for the selected operator'
            }
          }
        }
      }
    } else {
      node.type = 'custom_node'
      if (!node.data.config || typeof node.data.config !== 'object') {
        node.data.config = {}
      }
    }
  }

  if (triggerNodeIds.size === 0) {
    return { error: 'Workflow must include a trigger node' }
  }

  if (triggerNodeIds.size > 1) {
    return { error: 'Only one trigger node is allowed' }
  }

  const incomingCounts = new Map<string, number>()
  const outgoingCounts = new Map<string, number>()
  const conditionHandleCounts = new Map<string, { true: number; false: number }>()

  for (const nodeId of nodeIds) {
    incomingCounts.set(nodeId, 0)
    outgoingCounts.set(nodeId, 0)
  }

  for (const edge of workflow.edges) {
    if (!edge?.id || typeof edge.id !== 'string') {
      return { error: 'Invalid workflow structure: edge id missing' }
    }

    if (!edge?.source || typeof edge.source !== 'string') {
      return { error: 'Invalid workflow structure: edge source missing' }
    }

    if (!edge?.target || typeof edge.target !== 'string') {
      return { error: 'Invalid workflow structure: edge target missing' }
    }

    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return { error: 'Edge references unknown node id' }
    }

    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) || 0) + 1)
    outgoingCounts.set(edge.source, (outgoingCounts.get(edge.source) || 0) + 1)

    if (conditionNodeIds.has(edge.source)) {
      if (edge.sourceHandle !== 'true' && edge.sourceHandle !== 'false') {
        return {
          error:
            'Condition edges must include sourceHandle "true" or "false"'
        }
      }

      const handleCounts = conditionHandleCounts.get(edge.source) || {
        true: 0,
        false: 0
      }
      if (edge.sourceHandle === 'true') {
        handleCounts.true += 1
      } else {
        handleCounts.false += 1
      }
      conditionHandleCounts.set(edge.source, handleCounts)
    } else if (edge.sourceHandle) {
      delete edge.sourceHandle
    }
  }

  const startNodes = Array.from(nodeIds).filter(
    (nodeId) => (incomingCounts.get(nodeId) || 0) === 0
  )

  if (startNodes.length !== 1) {
    return { error: 'Workflow must have exactly one starting node' }
  }

  const startNodeId = startNodes[0]
  if (!triggerNodeIds.has(startNodeId)) {
    return { error: 'Starting node must be a trigger node' }
  }

  for (const triggerId of triggerNodeIds) {
    if (triggerId !== startNodeId) {
      return { error: 'Trigger nodes can only be used as the starting node' }
    }
  }

  for (const nodeId of nodeIds) {
    const incoming = incomingCounts.get(nodeId) || 0
    const outgoing = outgoingCounts.get(nodeId) || 0

    if (incoming > 1) {
      return { error: 'A node cannot have more than one incoming connection' }
    }

    if (conditionNodeIds.has(nodeId)) {
      const handleCounts = conditionHandleCounts.get(nodeId) || {
        true: 0,
        false: 0
      }
      if (incoming > 1) {
        return {
          error: 'Condition node cannot have more than one incoming connection'
        }
      }
      if (handleCounts.true > 1 || handleCounts.false > 1) {
        return {
          error:
            'Condition node can have only one connection per true/false branch'
        }
      }
      if (outgoing > 2) {
        return {
          error: 'Condition node can have at most two outgoing connections'
        }
      }
    } else {
      if (outgoing > 1) {
        return {
          error: 'A node cannot have more than one outgoing connection'
        }
      }
    }
  }

  // Ensure no standalone/disconnected nodes
  if (workflow.nodes.length > 1) {
    for (const nodeId of nodeIds) {
      const incoming = incomingCounts.get(nodeId) || 0
      const outgoing = outgoingCounts.get(nodeId) || 0
      if (incoming === 0 && outgoing === 0) {
        return { error: 'Standalone nodes are not allowed' }
      }
    }
  }

  // Ensure all nodes are connected from the start node
  const adjacency = new Map<string, string[]>()
  for (const nodeId of nodeIds) {
    adjacency.set(nodeId, [])
  }
  for (const edge of workflow.edges) {
    adjacency.get(edge.source)?.push(edge.target)
  }

  const visited = new Set<string>()
  const stack = [startNodeId]
  while (stack.length) {
    const current = stack.pop()!
    if (visited.has(current)) continue
    visited.add(current)
    for (const neighbor of adjacency.get(current) || []) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor)
      }
    }
  }

  if (visited.size !== nodeIds.size) {
    return { error: 'All nodes must be connected to the starting node' }
  }

  // Cycle detection (no loops)
  const inDegree = new Map<string, number>()
  for (const nodeId of nodeIds) {
    inDegree.set(nodeId, 0)
  }
  for (const edge of workflow.edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  }
  const queue: string[] = []
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId)
  }
  let visitedCount = 0
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    visitedCount++
    for (const neighbor of adjacency.get(nodeId) || []) {
      const nextDegree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, nextDegree)
      if (nextDegree === 0) queue.push(neighbor)
    }
  }
  if (visitedCount !== nodeIds.size) {
    return { error: 'Workflow contains a loop, which is not allowed' }
  }

  return { workflow }
}

export async function generateWorkflow(c: Context) {
  try {
    const { prompt } = await c.req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required' }, 400)
    }

    const trimmedPrompt = prompt.trim()
    if (!/[a-z0-9]/i.test(trimmedPrompt)) {
      return c.json({ error: 'Prompt is not meaningful' }, 400)
    }

    if (!process.env.GEMINI_API_KEY && !process.env.HF_TOKEN) {
      return c.json({ error: 'AI service not configured' }, 500)
    }

    let content = process.env.GEMINI_API_KEY
      ? await generateWithGemini({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: `Generate a workflow for: ${trimmedPrompt}`,
          maxTokens: 1500,
          temperature: 0,
          responseMimeType: 'application/json'
        })
      : await generateWithHuggingFace({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: `Generate a workflow for: ${trimmedPrompt}`,
          maxTokens: 1500,
          temperature: 0
        })

    // Clean response - remove markdown code blocks if present
    content = content
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim()

    // Try to extract JSON object from the response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      content = jsonMatch[0]
    }

    // Parse and validate the response
    let workflow: GeneratedWorkflow
    try {
      workflow = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      console.error('Parse error:', parseError)
      return c.json({ error: GENERIC_AI_ERROR }, 500)
    }

    const validation = validateAndNormalizeWorkflow(workflow)
    if (validation.error) {
      console.error('AI workflow validation failed', {
        error: validation.error,
        prompt: trimmedPrompt,
        aiResponse: content
      })
      return c.json({ error: GENERIC_AI_ERROR }, 400)
    }

    workflow = validation.workflow!

    // Add default edge styling
    const styledEdges = workflow.edges.map((edge) => ({
      ...edge,
      type: 'adaptive',
      style: { strokeWidth: 2, stroke: '#9ca3af' },
      markerEnd: {
        type: 'arrowclosed',
        color: '#9ca3af',
        width: 12,
        height: 12
      }
    }))

    return c.json({
      nodes: workflow.nodes,
      edges: styledEdges
    })
  } catch (error) {
    console.error('Generate workflow error:', error)
    return c.json({ error: 'Failed to generate workflow' }, 500)
  }
}
