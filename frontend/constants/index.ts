import googleDriveIcon from '@/public/google-drive.png'
import gmailIcon from '@/public/gmail.png'

export const NODE_TYPES = {
  GMAIL: 'GMAIL',
  GOOGLE_DRIVE: 'GOOGLE_DRIVE'
} as const

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export const NODE_OPTIONS = [
  { id: NODE_TYPES.GMAIL, name: 'Gmail', icon: gmailIcon },
  { id: NODE_TYPES.GOOGLE_DRIVE, name: 'Google Drive', icon: googleDriveIcon }
]
