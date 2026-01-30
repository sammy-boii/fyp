import googleDriveIcon from '@/public/google-drive.png'
import gmailIcon from '@/public/gmail.png'
import discordIcon from '@/public/discord.png'

export const NODE_TYPES = {
  GMAIL: 'GMAIL',
  GOOGLE_DRIVE: 'GOOGLE_DRIVE',
  DISCORD: 'DISCORD'
} as const

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export const NODE_OPTIONS = [
  { id: NODE_TYPES.GMAIL, name: 'Gmail', icon: gmailIcon },
  { id: NODE_TYPES.GOOGLE_DRIVE, name: 'Google Drive', icon: googleDriveIcon },
  { id: NODE_TYPES.DISCORD, name: 'Discord', icon: discordIcon }
]

export const CREDENTIALS_OPTIONS = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: gmailIcon,
    url: `${BACKEND_URL}/api/gmail/oauth`
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: googleDriveIcon,
    url: `${BACKEND_URL}/api/google-drive/oauth`
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: discordIcon,
    url: `${BACKEND_URL}/api/discord/oauth`
  }
]
