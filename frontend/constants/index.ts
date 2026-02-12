export const NODE_TYPES = {
  GMAIL: 'GMAIL',
  GOOGLE_DRIVE: 'GOOGLE_DRIVE',
  DISCORD: 'DISCORD',
  CONDITION: 'CONDITION',
  AI: 'AI',
  HTTP: 'HTTP'
} as const

// Trigger node types (nodes that start a workflow)
export const TRIGGER_NODE_TYPES = {
  MANUAL_TRIGGER: 'MANUAL_TRIGGER',
  GMAIL_WEBHOOK_TRIGGER: 'GMAIL_WEBHOOK_TRIGGER',
  DISCORD_WEBHOOK_TRIGGER: 'DISCORD_WEBHOOK_TRIGGER',
  SCHEDULE_TRIGGER: 'SCHEDULE_TRIGGER'
} as const

// All node types combined
export const ALL_NODE_TYPES = {
  ...NODE_TYPES,
  ...TRIGGER_NODE_TYPES
} as const

export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

export const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_BASE_URL

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'
