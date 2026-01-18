/**
 * Workflow Executor Controller
 *
 * Handles the execution of workflows by:
 * 1. Parsing workflow nodes and edges from the database
 * 2. Building a topological execution order (respecting dependencies)
 * 3. Executing nodes sequentially, passing data between them
 * 4. Recording execution results in WorkflowExecution and NodeExecution tables
 *
 * Currently supported actions:
 * - send_email: Sends an email via Gmail API
 * - read_email: Fetches emails from Gmail inbox
 *
 * Usage: GET /api/workflow/run/:id (authenticated)
 */

import { Context } from 'hono'
import { AppError } from '@/src/types'
import { tryCatch } from '@/src/lib/utils'
import { prisma } from '@shared/db/prisma'
import { getValidGmailAccessTokenByCredentialId } from '@/src/lib/credentials'
import { API_ROUTES } from '@/src/constants'
import { extractGmailMessageContent } from '@/src/helper/gmail-helper'

// ============================================================================
// Type Definitions
// ============================================================================

type WorkflowNode = {
  id: string
  type: string
  data: {
    actionId?: string
    config?: Record<string, any>
    [key: string]: any
  }
  [key: string]: any
}

type WorkflowEdge = {
  id: string
  source: string
  target: string
  [key: string]: any
}

type NodeExecutionResult = {
  success: boolean
  data?: any
  error?: string
}

// ============================================================================
// Execution Order Builder (Topological Sort)
// ============================================================================

/**
 * Build execution order based on edges using Kahn's algorithm (topological sort)
 */
const buildExecutionOrder = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): string[] => {
  const adjacencyList = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  // Initialize all nodes
  nodes.forEach((node) => {
    adjacencyList.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  // Build graph from edges
  edges.forEach((edge) => {
    adjacencyList.get(edge.source)?.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  })

  // Start with nodes that have no incoming edges (dependencies)
  const queue: string[] = []
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId)
    }
  })

  const executionOrder: string[] = []

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    executionOrder.push(nodeId)

    adjacencyList.get(nodeId)?.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) {
        queue.push(neighbor)
      }
    })
  }

  // Check for cycles
  if (executionOrder.length !== nodes.length) {
    throw new AppError('Workflow contains cycles and cannot be executed', 400)
  }

  return executionOrder
}

// ============================================================================
// Gmail Action Executors
// ============================================================================

/**
 * Execute send_email action
 */
const executeSendEmail = async (
  config: any,
  inputData: any
): Promise<NodeExecutionResult> => {
  console.log('[executeSendEmail] Starting with config:', JSON.stringify(config, null, 2))

  try {
    const { to, subject, body, credentialId } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    if (!to) {
      return { success: false, error: 'Missing recipient email address' }
    }

    // Get valid Gmail access token
    const { token } = await getValidGmailAccessTokenByCredentialId(credentialId)

    // Build email content
    const email = [
      `To: ${to}`,
      `Subject: ${subject || '(No Subject)'}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body || ''
    ].join('\r\n')

    // Encode for Gmail API
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    // Send via Gmail API
    const sendRes = await fetch(API_ROUTES.GMAIL.SEND_MESSAGE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedEmail })
    })

    if (!sendRes.ok) {
      const err = await sendRes.json()
      console.error('[executeSendEmail] Gmail API Error:', err)
      return { success: false, error: err?.error?.message || 'Failed to send email' }
    }

    const result = await sendRes.json()
    console.log('[executeSendEmail] Success:', result.id)

    return {
      success: true,
      data: {
        messageId: result.id,
        to,
        subject,
        message: 'Email sent successfully'
      }
    }
  } catch (error: any) {
    console.error('[executeSendEmail] Exception:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

/**
 * Execute read_email action
 */
const executeReadEmail = async (
  config: any,
  inputData: any
): Promise<NodeExecutionResult> => {
  console.log('[executeReadEmail] Starting with config:', JSON.stringify(config, null, 2))

  try {
    const { credentialId, maxResults = 10, from, to, subject, after, before, hasAttachment, isUnread, labelId } = config

    if (!credentialId) {
      return { success: false, error: 'Missing credential ID' }
    }

    // Get valid Gmail access token
    const { token } = await getValidGmailAccessTokenByCredentialId(credentialId)

    // Build Gmail search query
    const queryParts: string[] = []
    if (from) queryParts.push(`from:${from}`)
    if (to) queryParts.push(`to:${to}`)
    if (subject) queryParts.push(`subject:${subject}`)
    if (after) queryParts.push(`after:${after.replace(/-/g, '/')}`)
    if (before) queryParts.push(`before:${before.replace(/-/g, '/')}`)
    if (hasAttachment) queryParts.push('has:attachment')
    if (isUnread) queryParts.push('is:unread')

    const searchQuery = queryParts.join(' ')

    // Build request URL with query parameters
    const params = new URLSearchParams()
    params.set('maxResults', String(maxResults))
    if (searchQuery) params.set('q', searchQuery)
    if (labelId) params.set('labelIds', labelId)

    const listUrl = `${API_ROUTES.GMAIL.GET_MESSAGES}?${params.toString()}`

    // Fetch message list
    const messageListRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!messageListRes.ok) {
      const err = await messageListRes.json()
      console.error('[executeReadEmail] List messages failed:', err)
      return { success: false, error: err?.error?.message || 'Failed to fetch emails' }
    }

    const messageList = await messageListRes.json()
    console.log(`[executeReadEmail] Found ${messageList?.messages?.length || 0} messages`)

    if (!messageList?.messages?.length) {
      return { success: true, data: { emails: [], count: 0 } }
    }

    // Fetch full details for each message
    const emails = await Promise.all(
      messageList.messages.slice(0, maxResults).map(async (msg: any) => {
        const res = await fetch(API_ROUTES.GMAIL.GET_MESSAGE(msg.id), {
          headers: { Authorization: `Bearer ${token}` }
        })
        const message = await res.json()

        const { body, attachments } = await extractGmailMessageContent(
          message.id,
          message.payload,
          token
        )

        const headers = message.payload?.headers || []
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

        return {
          id: message.id,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          to: getHeader('To'),
          date: getHeader('Date'),
          snippet: message.snippet,
          body,
          attachmentCount: attachments.length
        }
      })
    )

    console.log('[executeReadEmail] Successfully processed messages')

    return {
      success: true,
      data: {
        emails,
        count: emails.length,
        query: searchQuery || 'all'
      }
    }
  } catch (error: any) {
    console.error('[executeReadEmail] Exception:', error)
    return { success: false, error: error.message || 'Failed to read emails' }
  }
}

// ============================================================================
// Node Executor
// ============================================================================

/**
 * Execute a single node based on its actionId
 */
const executeNode = async (
  node: WorkflowNode,
  executionId: string,
  inputData: any
): Promise<NodeExecutionResult> => {
  const { actionId, config } = node.data

  console.log(`[executeNode] Node ${node.id} | Action: ${actionId}`)

  // Create node execution record
  const nodeExecution = await prisma.nodeExecution.create({
    data: {
      executionId,
      nodeId: node.id,
      nodeType: node.type,
      actionId: actionId || 'unknown',
      config: config || {},
      inputData: inputData || null,
      status: 'RUNNING',
      startedAt: new Date()
    }
  })

  let result: NodeExecutionResult

  // Route to appropriate handler
  switch (actionId) {
    case 'send_email':
      result = await executeSendEmail(config, inputData)
      break

    case 'read_email':
      result = await executeReadEmail(config, inputData)
      break

    default:
      result = { success: false, error: `Unknown action: ${actionId}` }
  }

  // Update node execution record
  await prisma.nodeExecution.update({
    where: { id: nodeExecution.id },
    data: {
      status: result.success ? 'COMPLETED' : 'FAILED',
      outputData: result.data || null,
      error: result.error || null,
      completedAt: new Date()
    }
  })

  return result
}

// ============================================================================
// Main Workflow Handler
// ============================================================================

const runWorkflowHandler = async (c: Context) => {
  const workflowId = c.req.param('id')
  const user = c.get('user')

  if (!user) {
    throw new AppError('User not found', 401)
  }

  if (!workflowId) {
    throw new AppError('Workflow ID is required', 400)
  }

  // Fetch workflow
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  })

  if (!workflow) {
    throw new AppError('Workflow not found', 404)
  }

  // Verify ownership
  if (workflow.authorId !== user.id) {
    throw new AppError('Unauthorized to execute this workflow', 403)
  }

  // Parse nodes and edges
  const nodes = workflow.nodes as WorkflowNode[]
  const edges = workflow.edges as WorkflowEdge[]

  console.log(`\n=== Executing Workflow: ${workflow.name} (${workflow.id}) ===`)
  console.log(`Total nodes: ${nodes.length}, Total edges: ${edges.length}\n`)

  // Create workflow execution record
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      status: 'RUNNING',
      triggerType: 'MANUAL'
    }
  })

  const startTime = Date.now()

  try {
    // Build execution order
    const executionOrder = buildExecutionOrder(nodes, edges)
    console.log('Execution order:', executionOrder)

    // Execute nodes in order, passing output to next node
    const nodeOutputs = new Map<string, any>()

    for (const nodeId of executionOrder) {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) continue

      // Find predecessor nodes to get their outputs
      const predecessorOutputs = edges
        .filter((e) => e.target === nodeId)
        .map((e) => nodeOutputs.get(e.source))
        .filter(Boolean)

      // Combine all predecessor outputs as input
      const inputData = predecessorOutputs.length > 0
        ? predecessorOutputs.length === 1
          ? predecessorOutputs[0]
          : { sources: predecessorOutputs }
        : null

      const result = await executeNode(node, execution.id, inputData)

      if (!result.success) {
        // Stop on failure
        console.error(`Node ${nodeId} failed:`, result.error)
        const duration = Date.now() - startTime

        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            error: `Node ${nodeId} failed: ${result.error}`,
            duration,
            completedAt: new Date()
          }
        })

        throw new AppError(`Workflow execution failed at node ${nodeId}: ${result.error}`, 500)
      }

      // Store output for downstream nodes
      nodeOutputs.set(nodeId, result.data)
    }

    const duration = Date.now() - startTime

    // Mark as completed
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        duration,
        completedAt: new Date()
      }
    })

    console.log(`\n=== Workflow Execution Complete (${duration}ms) ===\n`)

    return {
      success: true,
      message: 'Workflow executed successfully',
      execution: {
        id: execution.id,
        workflowId: workflow.id,
        workflowName: workflow.name,
        duration,
        nodeCount: nodes.length,
        executedNodes: executionOrder.length
      }
    }
  } catch (error: any) {
    // If not already handled, mark as failed
    const duration = Date.now() - startTime

    const currentExecution = await prisma.workflowExecution.findUnique({
      where: { id: execution.id }
    })

    if (currentExecution?.status === 'RUNNING') {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          error: error.message,
          duration,
          completedAt: new Date()
        }
      })
    }

    console.error(`\n=== Workflow Execution Failed ===`)
    console.error(error)

    throw new AppError(`Workflow execution failed: ${error.message}`, 500, error)
  }
}

export const runWorkflow = tryCatch(runWorkflowHandler)