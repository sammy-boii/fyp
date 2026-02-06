import { InferenceClient } from '@huggingface/inference'
import { Context } from 'hono'

const HF_TOKEN = process.env.HF_TOKEN

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

const SYSTEM_PROMPT = `You are a workflow automation assistant that generates React Flow node structures.

${AVAILABLE_NODES}

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
      "target": "n2"
    }
  ]
}

RULES:
1. ALWAYS start with a trigger node (MANUAL_TRIGGER if not specified)
2. Use "trigger_node" for type when data.type ends with "_TRIGGER"
3. Use "condition_node" for type when data.type is "CONDITION"
4. Use "custom_node" for all other node types
5. Position nodes horizontally with x increasing by 300 for each step
6. Keep y position around 160 for a straight line layout
7. Generate unique IDs like "n1", "n2", "n3" etc.
8. Edge IDs should be "e_source_target" format
9. Connect nodes in sequence with edges
10. Return ONLY the JSON, no markdown, no explanation
11. config should always be an empty object {}
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
  }>
}

export async function generateWorkflow(c: Context) {
  try {
    const { prompt } = await c.req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required' }, 400)
    }

    if (!HF_TOKEN) {
      return c.json({ error: 'AI service not configured' }, 500)
    }

    const client = new InferenceClient(HF_TOKEN)

    const response = await client.chatCompletion({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Generate a workflow for: ${prompt.trim()}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.2
    })

    let content = response.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return c.json({ error: 'No response from AI' }, 500)
    }

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
      return c.json(
        { error: 'Failed to parse AI response. Please try again.' },
        500
      )
    }

    // Validate structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      return c.json({ error: 'Invalid workflow structure: missing nodes' }, 500)
    }

    if (!workflow.edges || !Array.isArray(workflow.edges)) {
      workflow.edges = []
    }

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
