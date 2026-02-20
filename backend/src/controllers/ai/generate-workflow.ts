import { Context } from 'hono'
import {
  generateWithGemini,
  generateWithHuggingFace
} from '../../lib/ai-client'

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

const INTENT_SYSTEM_PROMPT = `You are a workflow intent parser.

  ${AVAILABLE_NODES}

  Return ONLY valid JSON with this structure:
  {
    "status": "ready" | "needs_clarification" | "unsupported",
    "reason": "<short reason string>",
    "questions": ["<question 1>", "<question 2>"],
    "normalizedPrompt": "<rewritten prompt for workflow generation>",
    "triggerType": "MANUAL_TRIGGER" | "GMAIL_WEBHOOK_TRIGGER" | "DISCORD_WEBHOOK_TRIGGER" | "SCHEDULE_TRIGGER" | null,
    "steps": [
      {
        "type": "GMAIL" | "GOOGLE_DRIVE" | "DISCORD" | "AI" | "HTTP" | "CONDITION",
        "actionId": "<action id>"
      }
    ]
  }

  INTENT RULES:
  - Use "ready" only when the request can be turned into a concrete workflow.
  - Use "needs_clarification" if essential details are missing or ambiguous.
  - Use "unsupported" when request cannot be mapped to available nodes/actions.
  - For "needs_clarification", include 1-3 short questions.
  - If trigger is unspecified but intent is clear, use triggerType "MANUAL_TRIGGER".
  - Keep normalizedPrompt concise and specific for the workflow builder.
  - Never return markdown fences or extra commentary.
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

interface IntentStep {
  type: string
  actionId: string
}

interface ParsedIntent {
  status: 'ready' | 'needs_clarification' | 'unsupported'
  reason: string
  questions: string[]
  normalizedPrompt: string
  triggerType: string | null
  steps: IntentStep[]
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

const TRIGGER_NODE_TYPES = new Set([
  'MANUAL_TRIGGER',
  'GMAIL_WEBHOOK_TRIGGER',
  'DISCORD_WEBHOOK_TRIGGER',
  'SCHEDULE_TRIGGER'
])

const DETERMINISTIC_STEP_TYPES = new Set([
  'GMAIL',
  'GOOGLE_DRIVE',
  'DISCORD',
  'AI',
  'HTTP'
])

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

const normalizeNodeType = (nodeType: string): string =>
  nodeType
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_{2,}/g, '_')

const normalizeNodeAndAction = (
  nodeTypeRaw: string,
  actionIdRaw: string
): IntentStep | null => {
  const nodeType = normalizeNodeType(nodeTypeRaw)
  const allowedActions = ACTION_IDS_BY_NODE_TYPE[nodeType]

  if (!allowedActions) {
    return null
  }

  let actionId = normalizeActionId(actionIdRaw)
  if (!VALID_ACTION_IDS.has(actionId)) {
    const alias = ACTION_ID_ALIASES_BY_NODE_TYPE[nodeType]?.[actionId] || null
    if (!alias) {
      return null
    }
    actionId = alias
  }

  if (!allowedActions.includes(actionId)) {
    return null
  }

  return { type: nodeType, actionId }
}

const cleanModelContent = (content: string): string => {
  const stripped = content
    .replace(/```json\n?/gi, '')
    .replace(/```/g, '')
    .trim()

  const firstBrace = stripped.indexOf('{')
  const lastBrace = stripped.lastIndexOf('}')

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return stripped.slice(firstBrace, lastBrace + 1).trim()
  }

  return stripped
}

const parseJsonFromContent = (content: string): unknown | null => {
  const cleaned = cleanModelContent(content)
  try {
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

const toQuestionArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
}

const parseIntentPayload = (payload: unknown): ParsedIntent | null => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null
  }

  const raw = payload as Record<string, unknown>
  const statusRaw =
    typeof raw.status === 'string' ? raw.status.trim().toLowerCase() : ''

  if (
    statusRaw !== 'ready' &&
    statusRaw !== 'needs_clarification' &&
    statusRaw !== 'unsupported'
  ) {
    return null
  }

  const reason =
    typeof raw.reason === 'string' && raw.reason.trim()
      ? raw.reason.trim()
      : statusRaw === 'needs_clarification'
        ? 'I need a little more detail before generating this workflow.'
        : GENERIC_AI_ERROR

  const questions = toQuestionArray(raw.questions)

  const normalizedPrompt =
    typeof raw.normalizedPrompt === 'string' ? raw.normalizedPrompt.trim() : ''

  const triggerType =
    typeof raw.triggerType === 'string'
      ? normalizeNodeType(raw.triggerType)
      : null

  const normalizedTriggerType =
    triggerType && TRIGGER_NODE_TYPES.has(triggerType) ? triggerType : null

  const steps: IntentStep[] = Array.isArray(raw.steps)
    ? raw.steps
        .map((step) => {
          if (!step || typeof step !== 'object' || Array.isArray(step)) {
            return null
          }

          const rawStep = step as Record<string, unknown>
          const type = typeof rawStep.type === 'string' ? rawStep.type : ''
          const actionId =
            typeof rawStep.actionId === 'string' ? rawStep.actionId : ''

          if (!type || !actionId) {
            return null
          }

          return normalizeNodeAndAction(type, actionId)
        })
        .filter((step): step is IntentStep => !!step)
    : []

  return {
    status: statusRaw,
    reason,
    questions,
    normalizedPrompt,
    triggerType: normalizedTriggerType,
    steps
  }
}

const isPromptLikelyAmbiguous = (prompt: string): boolean => {
  const normalized = prompt.toLowerCase().trim()
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length <= 4) {
    return true
  }

  const hasConcreteAction =
    /(send|read|delete|create|save|upload|reply|list|schedule|webhook|api|http|if|then|else|gmail|drive|discord)/i.test(
      normalized
    )
  if (!hasConcreteAction) {
    return true
  }

  const vagueMarkers = [
    'something',
    'anything',
    'whatever',
    'stuff',
    'thing',
    'do it',
    'make it',
    'help me'
  ]
  return vagueMarkers.some((marker) => normalized.includes(marker))
}

type RoutedGenerationOptions = {
  systemPrompt: string
  userPrompt: string
  maxTokens: number
  temperature: number
  responseMimeType?: string
  preferStrongerModel?: boolean
}

const generateWithProviderRouting = async (
  options: RoutedGenerationOptions
): Promise<string> => {
  if (process.env.GEMINI_API_KEY) {
    const models = options.preferStrongerModel
      ? ['gemini-2.5-flash', 'gemini-2.5-flash-lite']
      : ['gemini-2.5-flash-lite']

    let lastError: unknown = null
    for (const model of models) {
      try {
        return await generateWithGemini({
          systemPrompt: options.systemPrompt,
          userPrompt: options.userPrompt,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          model,
          responseMimeType: options.responseMimeType
        })
      } catch (error) {
        lastError = error
      }
    }

    throw lastError || new Error('Gemini generation failed')
  }

  const models = options.preferStrongerModel
    ? ['meta-llama/Llama-3.3-70B-Instruct', 'meta-llama/Llama-3.1-8B-Instruct']
    : ['meta-llama/Llama-3.1-8B-Instruct']

  let lastError: unknown = null
  for (const model of models) {
    try {
      return await generateWithHuggingFace({
        systemPrompt: options.systemPrompt,
        userPrompt: options.userPrompt,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        model
      })
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('HuggingFace generation failed')
}

const buildDeterministicLinearWorkflow = (
  intent: ParsedIntent
): GeneratedWorkflow | null => {
  if (intent.status !== 'ready') {
    return null
  }

  const triggerType =
    intent.triggerType && TRIGGER_NODE_TYPES.has(intent.triggerType)
      ? intent.triggerType
      : 'MANUAL_TRIGGER'

  const triggerActionId = ACTION_IDS_BY_NODE_TYPE[triggerType]?.[0]
  if (!triggerActionId) {
    return null
  }

  const steps = intent.steps.filter((step) =>
    DETERMINISTIC_STEP_TYPES.has(step.type)
  )

  if (steps.length === 0 || steps.length !== intent.steps.length) {
    return null
  }

  const nodes: GeneratedWorkflow['nodes'] = []
  const edges: GeneratedWorkflow['edges'] = []

  nodes.push({
    id: 'n1',
    type: 'trigger_node',
    position: { x: 280, y: 160 },
    data: {
      type: triggerType,
      actionId: triggerActionId,
      config: {}
    }
  })

  steps.forEach((step, index) => {
    const nodeId = `n${index + 2}`
    nodes.push({
      id: nodeId,
      type: 'custom_node',
      position: { x: 280 + (index + 1) * 300, y: 160 },
      data: {
        type: step.type,
        actionId: step.actionId,
        config: {}
      }
    })
  })

  for (let i = 1; i < nodes.length; i++) {
    const source = nodes[i - 1].id
    const target = nodes[i].id
    edges.push({
      id: `e_${source}_${target}`,
      source,
      target
    })
  }

  return { nodes, edges }
}

const extractIntentFromPrompt = async (
  prompt: string,
  preferStrongerModel: boolean
): Promise<ParsedIntent | null> => {
  const content = await generateWithProviderRouting({
    systemPrompt: INTENT_SYSTEM_PROMPT,
    userPrompt: `Extract workflow intent for: ${prompt}`,
    maxTokens: 600,
    temperature: 0,
    responseMimeType: 'application/json',
    preferStrongerModel
  })

  const payload = parseJsonFromContent(content)
  return parseIntentPayload(payload)
}

const toUserFacingValidationError = (error: string): string => {
  const normalized = error.toLowerCase()

  if (
    normalized.includes('failed to generate workflow') ||
    normalized.includes('invalid json response')
  ) {
    return 'I could not reliably generate a workflow from this prompt. Please specify trigger, app, and exact actions.'
  }

  if (
    normalized.includes('unsupported node type') ||
    normalized.includes('unsupported actionid')
  ) {
    return 'I could not map this request to supported actions. Mention the app and action clearly (for example: Gmail send_email, Google Drive create_file).'
  }

  if (normalized.includes('condition')) {
    return 'Your condition logic is incomplete. Include field, operator, and value (or use is_empty / is_not_empty).'
  }

  if (normalized.includes('trigger')) {
    return 'Please specify one trigger, or leave it implicit to use a manual trigger.'
  }

  if (
    normalized.includes('invalid workflow structure') ||
    normalized.includes('starting node')
  ) {
    return 'I could not produce a valid workflow graph from this prompt. Please make the steps more explicit.'
  }

  return error || GENERIC_AI_ERROR
}

const styleWorkflowEdges = (workflow: GeneratedWorkflow) =>
  workflow.edges.map((edge) => ({
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

const generateWorkflowWithRepair = async (
  prompt: string,
  preferStrongerModel: boolean
): Promise<{
  workflow?: GeneratedWorkflow
  error?: string
  lastResponse?: string
}> => {
  const maxAttempts = 3
  let userPrompt = `Generate a workflow for: ${prompt}`
  let lastError = ''
  let lastResponse = ''

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const content = await generateWithProviderRouting({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 1500,
      temperature: 0,
      responseMimeType: 'application/json',
      preferStrongerModel
    })

    const cleaned = cleanModelContent(content)
    lastResponse = cleaned

    const payload = parseJsonFromContent(cleaned)
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      lastError = 'Invalid JSON response from model'
    } else {
      const validation = validateAndNormalizeWorkflow(
        payload as GeneratedWorkflow
      )
      if (!validation.error) {
        return { workflow: validation.workflow }
      }

      lastError = validation.error
    }

    if (attempt < maxAttempts) {
      userPrompt = `Your previous response was invalid.

  Original request:
  ${prompt}

  Validation error:
  ${lastError}

  Previous response:
  ${cleaned}

  Return ONLY corrected JSON that satisfies all workflow rules.`
    }
  }

  return {
    error: lastError || GENERIC_AI_ERROR,
    lastResponse
  }
}

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
      const alias = ACTION_ID_ALIASES_BY_NODE_TYPE[nodeType]?.[actionId] || null
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
          error: 'Condition node requires config with matchType and conditions'
        }
      }

      const matchType = config.matchType
      const conditions = config.conditions

      if (matchType !== 'all' && matchType !== 'any') {
        return {
          error: 'Condition node config.matchType must be "all" or "any"'
        }
      }

      if (!Array.isArray(conditions) || conditions.length === 0) {
        return {
          error: 'Condition node config.conditions must be a non-empty array'
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
              error: 'Condition value is required for the selected operator'
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
  const conditionHandleCounts = new Map<
    string,
    { true: number; false: number }
  >()

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
          error: 'Condition edges must include sourceHandle "true" or "false"'
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
    const preferStrongerModel = isPromptLikelyAmbiguous(trimmedPrompt)

    let parsedIntent: ParsedIntent | null = null
    try {
      parsedIntent = await extractIntentFromPrompt(
        trimmedPrompt,
        preferStrongerModel
      )
    } catch (intentError) {
      console.error(
        'Intent extraction failed, continuing with workflow generation:',
        intentError
      )
    }

    if (parsedIntent?.status === 'needs_clarification') {
      return c.json(
        {
          error: parsedIntent.reason,
          needsClarification: true,
          questions:
            parsedIntent.questions.length > 0
              ? parsedIntent.questions
              : [
                  'Which app should this workflow use (Gmail, Google Drive, Discord, AI, or HTTP)?',
                  'What should trigger the workflow?',
                  'What exact action should happen next?'
                ]
        },
        422
      )
    }

    if (parsedIntent?.status === 'unsupported') {
      return c.json({ error: parsedIntent.reason }, 400)
    }

    if (parsedIntent?.status === 'ready') {
      const deterministicWorkflow =
        buildDeterministicLinearWorkflow(parsedIntent)
      if (deterministicWorkflow) {
        const deterministicValidation = validateAndNormalizeWorkflow(
          deterministicWorkflow
        )
        if (
          !deterministicValidation.error &&
          deterministicValidation.workflow
        ) {
          return c.json({
            nodes: deterministicValidation.workflow.nodes,
            edges: styleWorkflowEdges(deterministicValidation.workflow)
          })
        }
      }
    }

    const promptForGeneration =
      parsedIntent?.normalizedPrompt && parsedIntent.normalizedPrompt.length > 0
        ? parsedIntent.normalizedPrompt
        : trimmedPrompt

    const generation = await generateWorkflowWithRepair(
      promptForGeneration,
      preferStrongerModel
    )

    if (!generation.workflow || generation.error) {
      const userError = toUserFacingValidationError(
        generation.error || GENERIC_AI_ERROR
      )

      const clarificationQuestions =
        parsedIntent?.questions && parsedIntent.questions.length > 0
          ? parsedIntent.questions
          : [
              'Which trigger do you want (manual, Gmail webhook, Discord webhook, schedule)?',
              'Which app/action should run next?',
              'If you need branching, what exact condition should be evaluated?'
            ]

      const needsClarification =
        userError.includes('Please specify') ||
        userError.includes('incomplete') ||
        userError.includes('make the steps more explicit')

      console.error('AI workflow generation failed', {
        error: generation.error,
        prompt: trimmedPrompt,
        promptForGeneration,
        aiResponse: generation.lastResponse
      })

      return c.json(
        needsClarification
          ? {
              error: userError,
              needsClarification: true,
              questions: clarificationQuestions
            }
          : { error: userError },
        needsClarification ? 422 : 400
      )
    }

    return c.json({
      nodes: generation.workflow.nodes,
      edges: styleWorkflowEdges(generation.workflow)
    })
  } catch (error) {
    console.error('Generate workflow error:', error)
    return c.json({ error: 'Failed to generate workflow' }, 500)
  }
}
