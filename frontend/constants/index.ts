export const NODE_TYPES = {
  GMAIL: 'GMAIL',
  GOOGLE_DRIVE: 'GOOGLE_DRIVE',
  DISCORD: 'DISCORD'
} as const

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'
