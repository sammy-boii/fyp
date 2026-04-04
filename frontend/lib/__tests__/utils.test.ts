import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { cn, tryCatch } from '../utils'

describe('utils (frontend)', () => {
  it('merges class names with tailwind precedence', () => {
    expect(cn('p-2', false && 'hidden', 'p-4')).toBe('p-4')
  })

  it('returns data for successful async call', async () => {
    const result = await tryCatch(async () => ({ ok: true }))

    expect(result).toEqual({
      data: { ok: true },
      error: null
    })
  })

  it('returns parsed zod error message', async () => {
    const schema = z.object({ email: z.string().email() })

    const result = await tryCatch(async () => {
      schema.parse({ email: 'not-an-email' })
      return 'never'
    })

    expect(result.data).toBeNull()
    expect(result.error).toContain('email')
  })

  it('returns fallback message for non-error throws', async () => {
    const result = await tryCatch(async () => {
      throw 'bad'
    }, 'while testing')

    expect(result).toEqual({
      data: null,
      error: 'Something went wrong while testing'
    })
  })
})
