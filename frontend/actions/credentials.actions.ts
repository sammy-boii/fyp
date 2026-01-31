'use server'

import { updateCredentialSchema } from '@/schema/credential.schema'
import { prisma } from '@shared/db/prisma'
import { tryCatch } from '@/lib/utils'
import { getCurrentUser } from '@/data/dal'

export async function getCredentials() {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const credentials = await prisma.oAuthCredential.findMany({
      where: {
        userId: user.id
      }
    })

    return credentials
  })
}

export async function updateCredentials(id: string, notes: string | null) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Verify the credential belongs to the current user
    const credential = await prisma.oAuthCredential.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!credential) {
      throw new Error('Credential not found or access denied')
    }

    const parsedNotes = updateCredentialSchema.parse(notes)

    const updatedCredential = await prisma.oAuthCredential.update({
      where: { id },
      data: {
        notes: parsedNotes ?? null
      }
    })

    return updatedCredential
  })
}

export async function deleteCredential(id: string) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Verify the credential belongs to the current user
    const credential = await prisma.oAuthCredential.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!credential) {
      throw new Error('Credential not found or access denied')
    }

    await prisma.oAuthCredential.delete({
      where: { id }
    })

    return { success: true }
  })
}

export async function addDiscordConnection(notes?: string) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Check if credential already exists
    const existingCredential = await prisma.oAuthCredential.findFirst({
      where: {
        userId: user.id,
        provider: 'discord',
        service: 'bot'
      }
    })

    let credential
    if (existingCredential) {
      return {
        id: existingCredential.id,
        provider: existingCredential.provider,
        service: existingCredential.service,
        alreadyConnected: true
      }
    } else {
      credential = await prisma.oAuthCredential.create({
        data: {
          userId: user.id,
          provider: 'discord',
          service: 'bot',
          accessToken: 'shared-bot', // placeholder
          notes: notes,
          accessTokenExpiresAt: null // they don't expire
        }
      })
    }

    return {
      id: credential.id,
      provider: credential.provider,
      service: credential.service
    }
  })
}
