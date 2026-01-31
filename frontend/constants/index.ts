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
    url: `${BACKEND_URL}/api/gmail/oauth`,
    description: 'Connect your Gmail and manage emails'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: googleDriveIcon,
    url: `${BACKEND_URL}/api/google-drive/oauth`,
    description: 'Access and manage files from your Google Drive'
  },
  {
    id: 'bot',
    name: 'Discord',
    icon: discordIcon,
    url: 'https://discord.com/oauth2/authorize?client_id=1466759269763514513&permissions=0&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fdiscord%2Foauth&integration_type=0&scope=email+bot',
    description: 'Add a bot to a server to manage interactions'
  }
]
