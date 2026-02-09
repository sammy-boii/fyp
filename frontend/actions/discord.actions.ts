'use server'

import { getCurrentUser } from '@/data/dal'
import { api } from '@/lib/api'
import { tryCatch } from '@/lib/utils'

export type Guild = {
  id: string
  name: string
  icon: string | null
  owner: boolean
}

export type Channel = {
  id: string
  name: string
  type: string
  typeId: number
  position: number
  parentId: string | null
  topic: string | null
}

export type GuildMember = {
  id: string
  username: string
  displayName: string
  avatar: string | null
  isBot: boolean
}

export async function listGuilds(credentialId: string) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const params = new URLSearchParams()
    params.set('credentialId', credentialId)

    const data = await api
      .get('api/discord/guilds', { searchParams: params })
      .json<{ data: Guild[] }>()

    return data.data
  })
}

export async function listChannels(
  credentialId: string,
  guildId: string,
  type: 'all' | 'text' | 'voice' | 'category' | 'announcement' | 'forum' = 'all'
) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const params = new URLSearchParams()
    params.set('credentialId', credentialId)
    params.set('guildId', guildId)
    params.set('type', type)

    const data = await api
      .get('api/discord/channels', { searchParams: params })
      .json<{ data: Channel[] }>()

    return data.data
  })
}

export async function listGuildMembers(
  credentialId: string,
  guildId: string,
  limit: number = 100
) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const params = new URLSearchParams()
    params.set('credentialId', credentialId)
    params.set('guildId', guildId)
    params.set('limit', limit.toString())

    const data = await api
      .get('api/discord/members', { searchParams: params })
      .json<{ data: GuildMember[] }>()

    return data.data
  })
}
