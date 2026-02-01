'use server'

import { getCurrentUser } from '@/data/dal'
import { tryCatch } from '@/lib/utils'
import { cookies } from 'next/headers'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

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

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      throw new Error('Not authenticated')
    }

    const params = new URLSearchParams()
    params.set('credentialId', credentialId)

    const response = await fetch(
      `${BACKEND_URL}/api/discord/guilds?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to fetch guilds')
    }

    const data = await response.json()
    return data.data as Guild[]
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

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      throw new Error('Not authenticated')
    }

    const params = new URLSearchParams()
    params.set('credentialId', credentialId)
    params.set('guildId', guildId)
    params.set('type', type)

    const response = await fetch(
      `${BACKEND_URL}/api/discord/channels?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to fetch channels')
    }

    const data = await response.json()
    return data.data as Channel[]
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

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      throw new Error('Not authenticated')
    }

    const params = new URLSearchParams()
    params.set('credentialId', credentialId)
    params.set('guildId', guildId)
    params.set('limit', limit.toString())

    const response = await fetch(
      `${BACKEND_URL}/api/discord/members?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to fetch guild members')
    }

    const data = await response.json()
    return data.data as GuildMember[]
  })
}
