'use client'

import type {
  DemoChannel,
  DemoCredentialOption,
  DemoDriveItem,
  DemoGuild,
  DemoGuildMember,
  DemoWorkflowAdapter
} from '@/app/(main)/workflows/[id]/_context/WorkflowEditorContext'
import { createInferredOutputForAction } from '@/lib/node-execution-store'

const DEMO_EXECUTION_DELAY_MS = 2000

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

const DEMO_CREDENTIALS: DemoCredentialOption[] = [
  {
    id: 'demo-gmail-credential',
    provider: 'gmail',
    service: 'gmail'
  },
  {
    id: 'demo-drive-credential',
    provider: 'google drive',
    service: 'google-drive'
  },
  {
    id: 'demo-discord-credential',
    provider: 'discord bot',
    service: 'bot'
  }
]

const DEMO_GUILDS_BY_CREDENTIAL: Record<string, DemoGuild[]> = {
  'demo-discord-credential': [
    {
      id: 'demo-guild-ops',
      name: 'Mission Control',
      icon: null,
      owner: true
    },
    {
      id: 'demo-guild-community',
      name: 'Launch Lounge',
      icon: null,
      owner: false
    }
  ]
}

const DEMO_CHANNELS_BY_GUILD: Record<string, DemoChannel[]> = {
  'demo-guild-ops': [
    {
      id: 'demo-category-updates',
      name: 'Updates',
      type: 'category',
      typeId: 4,
      position: 0,
      parentId: null,
      topic: null
    },
    {
      id: 'demo-channel-alerts',
      name: 'alerts',
      type: 'text',
      typeId: 0,
      position: 1,
      parentId: 'demo-category-updates',
      topic: 'Operational alerts and automation updates'
    },
    {
      id: 'demo-channel-ops',
      name: 'ops-room',
      type: 'text',
      typeId: 0,
      position: 2,
      parentId: 'demo-category-updates',
      topic: 'Operator coordination'
    },
    {
      id: 'demo-voice-standup',
      name: 'standup',
      type: 'voice',
      typeId: 2,
      position: 0,
      parentId: null,
      topic: null
    }
  ],
  'demo-guild-community': [
    {
      id: 'demo-category-general',
      name: 'General',
      type: 'category',
      typeId: 4,
      position: 0,
      parentId: null,
      topic: null
    },
    {
      id: 'demo-channel-intros',
      name: 'introductions',
      type: 'text',
      typeId: 0,
      position: 1,
      parentId: 'demo-category-general',
      topic: 'Meet the team'
    },
    {
      id: 'demo-channel-announcements',
      name: 'announcements',
      type: 'announcement',
      typeId: 5,
      position: 2,
      parentId: 'demo-category-general',
      topic: 'Project updates'
    }
  ]
}

const DEMO_MEMBERS_BY_GUILD: Record<string, DemoGuildMember[]> = {
  'demo-guild-ops': [
    {
      id: 'demo-user-maya',
      username: 'maya.ops',
      displayName: 'Maya',
      avatar: null,
      isBot: false
    },
    {
      id: 'demo-user-rio',
      username: 'rio.automation',
      displayName: 'Rio',
      avatar: null,
      isBot: false
    },
    {
      id: 'demo-user-orbit',
      username: 'orbit-bot',
      displayName: 'Orbit Bot',
      avatar: null,
      isBot: true
    }
  ],
  'demo-guild-community': [
    {
      id: 'demo-user-sam',
      username: 'sam.launch',
      displayName: 'Sam',
      avatar: null,
      isBot: false
    },
    {
      id: 'demo-user-lina',
      username: 'lina.support',
      displayName: 'Lina',
      avatar: null,
      isBot: false
    }
  ]
}

const DEMO_DRIVE_ITEMS_BY_FOLDER: Record<string, DemoDriveItem[]> = {
  root: [
    {
      id: 'demo-drive-folder-briefs',
      name: 'Weekly Briefs',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '',
      isFolder: true
    },
    {
      id: 'demo-drive-folder-assets',
      name: 'Launch Assets',
      mimeType: 'application/vnd.google-apps.folder',
      iconLink: '',
      isFolder: true
    },
    {
      id: 'demo-drive-file-roster',
      name: 'team-roster.csv',
      mimeType: 'text/csv',
      iconLink: '',
      isFolder: false
    },
    {
      id: 'demo-drive-file-plan',
      name: 'execution-plan.pdf',
      mimeType: 'application/pdf',
      iconLink: '',
      isFolder: false
    }
  ],
  'demo-drive-folder-briefs': [
    {
      id: 'demo-drive-file-brief-apr',
      name: 'brief-april.txt',
      mimeType: 'text/plain',
      iconLink: '',
      isFolder: false
    },
    {
      id: 'demo-drive-file-brief-may',
      name: 'brief-may.txt',
      mimeType: 'text/plain',
      iconLink: '',
      isFolder: false
    }
  ],
  'demo-drive-folder-assets': [
    {
      id: 'demo-drive-file-logo',
      name: 'launch-logo.png',
      mimeType: 'image/png',
      iconLink: '',
      isFolder: false
    },
    {
      id: 'demo-drive-file-copy',
      name: 'campaign-copy.docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      iconLink: '',
      isFolder: false
    }
  ]
}

const filterChannels = (
  channels: DemoChannel[],
  type: 'all' | 'text' | 'voice' | 'category' | 'announcement' | 'forum'
) => {
  if (type === 'all') {
    return channels
  }

  return channels.filter((channel) => channel.type === type)
}

const filterDriveItems = (
  items: DemoDriveItem[],
  type: 'all' | 'files' | 'folders'
) => {
  if (type === 'folders') {
    return items.filter((item) => item.isFolder)
  }

  if (type === 'files') {
    return items.filter((item) => !item.isFolder)
  }

  return items
}

export const buildDemoNodeOutput = ({
  actionId,
  config,
  nodeLabel
}: {
  actionId?: string
  config?: Record<string, any>
  nodeLabel?: string
}) => {
  const inferredOutput = createInferredOutputForAction(actionId as any, config)

  if (!inferredOutput) {
    return {
      status: 'ok',
      message: `${nodeLabel || 'Node'} finished with demo output.`,
      demo: true
    }
  }

  return {
    ...inferredOutput,
    demo: true,
    source: 'local-demo-run'
  }
}

export const createDemoWorkflowAdapter = (): DemoWorkflowAdapter => {
  return {
    isDemo: true,
    credentials: DEMO_CREDENTIALS,
    listGuilds: async (credentialId) => {
      return DEMO_GUILDS_BY_CREDENTIAL[credentialId] ?? []
    },
    listChannels: async (credentialId, guildId, type = 'all') => {
      if (!DEMO_GUILDS_BY_CREDENTIAL[credentialId]) {
        return []
      }

      const channels = DEMO_CHANNELS_BY_GUILD[guildId] ?? []
      return filterChannels(channels, type)
    },
    listGuildMembers: async (credentialId, guildId) => {
      if (!DEMO_GUILDS_BY_CREDENTIAL[credentialId]) {
        return []
      }

      return DEMO_MEMBERS_BY_GUILD[guildId] ?? []
    },
    listDriveItems: async (credentialId, type = 'all', folderId) => {
      if (credentialId !== 'demo-drive-credential') {
        return []
      }

      const items = DEMO_DRIVE_ITEMS_BY_FOLDER[folderId || 'root'] ?? []
      return filterDriveItems(items, type)
    },
    executeNode: async ({ actionId, config, nodeLabel }) => {
      await sleep(DEMO_EXECUTION_DELAY_MS)
      return buildDemoNodeOutput({
        actionId,
        config,
        nodeLabel
      })
    }
  }
}

export { DEMO_EXECUTION_DELAY_MS }
