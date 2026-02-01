export const NODE_TYPES = {
  GMAIL: 'GMAIL',
  GOOGLE_DRIVE: 'GOOGLE_DRIVE',
  DISCORD: 'DISCORD'
} as const

// Trigger node types (nodes that start a workflow)
export const TRIGGER_NODE_TYPES = {
  MANUAL_TRIGGER: 'MANUAL_TRIGGER',
  GMAIL_WEBHOOK_TRIGGER: 'GMAIL_WEBHOOK_TRIGGER',
  DISCORD_WEBHOOK_TRIGGER: 'DISCORD_WEBHOOK_TRIGGER'
} as const

// All node types combined
export const ALL_NODE_TYPES = {
  ...NODE_TYPES,
  ...TRIGGER_NODE_TYPES
} as const

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'
