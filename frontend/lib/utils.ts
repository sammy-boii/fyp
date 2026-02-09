import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ZodError } from 'zod'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Success<T> = {
  data: T
  error: null
}

type Failure<E = string> = {
  error: E
  data: null
}

type Result<T, E = string> = Success<T> | Failure<E>

export type ApiResponse<T, E = Error> = Result<T, E>

export async function tryCatch<T>(
  fn: () => Promise<T>,
  ctx?: string
): Promise<Result<T>> {
  try {
    const data = await fn()
    return {
      data,
      error: null
    }
  } catch (err) {
    if (err instanceof ZodError) {
      const issue = err.issues[0]

      const path = issue.path.length ? issue.path.join('.') + ': ' : ''
      const message = path + issue.message

      return {
        error: message,
        data: null
      }
    }

    if (err instanceof Error) {
      return {
        error: err.message,
        data: null
      }
    }

    return {
      error: `Something went wrong ${ctx ? ctx : ''}`,
      data: null
    }
  }
}
