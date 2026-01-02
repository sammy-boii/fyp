import { Context } from 'hono'
import { PrismaClient } from '@prisma/client'
import { AppError } from '@/src/types'
import { tryCatch } from '@/src/lib/utils'
import { prisma } from '@shared/db/prisma'

type NodeHandler = (node: {
  id: string
  type: string
  data: Record<string, any>
  [key: string]: any
}) => void

// Node handler registry - add new handlers here
const nodeHandlers: Record<string, NodeHandler> = {
  send_email: (node) => {
    console.log(`    → This is a SEND_EMAIL node`)
    console.log(`    → Config:`, node.data)
  },
  get_email: (node) => {
    console.log(`    → This is a GET_EMAIL node`)
    console.log(`    → Config:`, node.data)
  }
}

// Default handler for unknown nodes
const defaultHandler: NodeHandler = (node) => {
  console.log(`    → This is a generic node of type: ${node.type}`)
}

const handleNodeExecution = (
  node: {
    id: string
    type: string
    data: Record<string, any>
    [key: string]: any
  },
  index: number
) => {
  console.log(
    `[${index + 1}] Node "${node.id}" (Type: ${
      node.type
    }) - this is getting executed`
  )

  // Get handler for this node or use default
  const handler = nodeHandlers[node.id] || defaultHandler
  handler(node)
}

const runWorkflowHandler = async (c: Context) => {
  const workflowId = c.req.param('id')

  if (!workflowId) {
    throw new AppError('Workflow ID is required', 400)
  }

  // Fetch the workflow from database
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  })

  if (!workflow) {
    throw new AppError('Workflow not found', 404)
  }

  // Parse nodes from JSON
  const nodes = workflow.nodes as Array<{
    id: string
    type: string
    data: Record<string, any>
    [key: string]: any
  }>

  // Parse edges from JSON
  const edges = workflow.edges as Array<{
    id: string
    source: string
    target: string
    [key: string]: any
  }>

  console.log(`\n=== Executing Workflow: ${workflow.name} (${workflow.id}) ===`)
  console.log(`Total nodes: ${nodes.length}`)
  console.log(`Total edges: ${edges.length}\n`)

  // Execute each node
  nodes.forEach((node, index) => {
    handleNodeExecution(node, index)
  })

  console.log(`\n=== Workflow Execution Complete ===\n`)

  return {
    success: true,
    message: 'Workflow execution started',
    workflow: {
      id: workflow.id,
      name: workflow.name,
      nodeCount: nodes.length,
      edgeCount: edges.length
    }
  }
}

export const runWorkflow = tryCatch(runWorkflowHandler)
