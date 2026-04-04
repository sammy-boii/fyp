import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../../types'
import { decodeBase64, tryCatch } from '../utils'

describe('utils (backend)', () => {
  it('decodes base64 and handles empty input', () => {
    const text = 'hello world'
    const base64 = Buffer.from(text, 'utf8').toString('base64')

    expect(decodeBase64(base64)).toBe(text)
    expect(decodeBase64('')).toBe('')
  })

  it('falls back to atob for non-utf8 payloads', () => {
    expect(decodeBase64('/w==')).toBe(String.fromCharCode(255))
  })

  it('wraps successful handler output with data', async () => {
    const json = vi.fn((body: unknown, status?: number) => ({ body, status }))
    const c = { json } as any
    const wrapped = tryCatch(async () => ({ ok: true }))

    const result = await wrapped(c)

    expect(json).toHaveBeenCalledWith({ data: { ok: true } })
    expect(result).toEqual({ body: { data: { ok: true } }, status: undefined })
  })

  it('returns response directly when handler already returns Response', async () => {
    const json = vi.fn((body: unknown, status?: number) => ({ body, status }))
    const c = { json } as any
    const response = new Response('ok', { status: 201 })
    const wrapped = tryCatch(async () => response)

    const result = await wrapped(c)

    expect(result).toBe(response)
    expect(json).not.toHaveBeenCalled()
  })

  it('maps AppError to json response with status code', async () => {
    const json = vi.fn((body: unknown, status?: number) => ({ body, status }))
    const c = { json } as any
    const wrapped = tryCatch(async () => {
      throw new AppError('Bad request', 400, { reason: 'invalid' })
    })

    const result = await wrapped(c)

    expect(result).toEqual({
      body: { error: 'Bad request', details: { reason: 'invalid' } },
      status: 400
    })
  })

  it('maps unknown errors to 500 json response', async () => {
    const json = vi.fn((body: unknown, status?: number) => ({ body, status }))
    const c = { json } as any
    const wrapped = tryCatch(async () => {
      throw new Error('boom')
    })

    const result = await wrapped(c)

    expect(result).toEqual({ body: { error: 'boom' }, status: 500 })
  })
})
