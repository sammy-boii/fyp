import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@shared/db/prisma', () => {
  return {
    prisma: {
      oAuthCredential: {
        findUnique: vi.fn(),
        update: vi.fn()
      }
    }
  }
})

vi.mock('../crypto', () => {
  return {
    encryptToken: vi.fn((value: string) => `enc:${value}`),
    decryptToken: vi.fn((value: string) => `dec:${value}`)
  }
})

import { prisma } from '@shared/db/prisma'
import {
  getDiscordBotToken,
  getValidGoogleDriveAccessTokenByCredentialId
} from '../credentials'

describe('credentials (backend)', () => {
  const findUniqueMock = vi.mocked(prisma.oAuthCredential.findUnique)
  const updateMock = vi.mocked(prisma.oAuthCredential.update)

  beforeEach(() => {
    vi.clearAllMocks()

    process.env.DISCORD_BOT_TOKEN = 'discord-bot-token'
    process.env.GOOGLE_DRIVE_CLIENT_ID = 'drive-client-id'
    process.env.GOOGLE_DRIVE_CLIENT_SECRET = 'drive-client-secret'

    global.fetch = vi.fn() as unknown as typeof fetch
  })

  it('returns discord bot token when credential is valid', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'discord-1',
      provider: 'discord'
    } as any)

    const token = await getDiscordBotToken('discord-1')

    expect(token).toBe('discord-bot-token')
  })

  it('throws when discord credential provider is invalid', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'not-discord',
      provider: 'gmail'
    } as any)

    await expect(getDiscordBotToken('not-discord')).rejects.toThrow(
      'Invalid credential type - expected Discord credential'
    )
  })

  it('returns decrypted token for non-expired drive credential without refresh', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'drive-1',
      provider: 'drive',
      accessToken: 'encrypted-access',
      refreshToken: 'encrypted-refresh',
      accessTokenExpiresAt: new Date(Date.now() + 60_000)
    } as any)

    const result = await getValidGoogleDriveAccessTokenByCredentialId('drive-1')

    expect(result.token).toBe('dec:encrypted-access')
    expect(global.fetch).not.toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('refreshes expired drive token and persists updated access token', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'drive-2',
      provider: 'drive',
      accessToken: 'old-access',
      refreshToken: 'encrypted-refresh',
      accessTokenExpiresAt: new Date(Date.now() - 60_000)
    } as any)

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        expires_in: 1800
      })
    } as Response)

    updateMock.mockImplementation(async (args: any) => {
      return {
        id: args.where.id,
        provider: 'drive',
        accessToken: args.data.accessToken,
        accessTokenExpiresAt: args.data.accessTokenExpiresAt
      } as any
    })

    const result = await getValidGoogleDriveAccessTokenByCredentialId('drive-2')

    expect(global.fetch).toHaveBeenCalledTimes(1)

    const [, requestInit] = vi.mocked(global.fetch).mock.calls[0]
    const body = String(requestInit?.body)
    expect(body).toContain('client_id=drive-client-id')
    expect(body).toContain('client_secret=drive-client-secret')
    expect(body).toContain('refresh_token=dec%3Aencrypted-refresh')

    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(result.token).toBe('dec:enc:new-access-token')
    expect(result.credential.accessToken).toBe('enc:new-access-token')
  })
})
