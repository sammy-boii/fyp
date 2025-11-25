import { Context } from 'hono'
import { AppError } from '../types'

export function decodeBase64(data: string) {
  if (!data) return ''
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
  } catch {
    return atob(base64)
  }
}

export const tryCatch = <T>(fn: (c: Context) => Promise<T>) => {
  return async (c: Context) => {
    try {
      const result = await fn(c)

      // if result is alr a Response obj, return it directly
      if (result instanceof Response) {
        return result
      }

      return c.json({
        data: result
      })
    } catch (err) {
      if (err instanceof AppError)
        return c.json(
          {
            error: err.message,
            details: err.details ?? ''
          },
          err.statusCode
        )

      return c.json(
        {
          error: err instanceof Error ? err.message : 'Internal server error'
        },
        500
      )
    }
  }
}
