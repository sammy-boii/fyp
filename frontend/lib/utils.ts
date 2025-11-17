import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Success<T> = {
  data: T
  error: null
}

type Failure<E = Error> = {
  error: E
  data: null
}

type Result<T, E = Error> = Success<T> | Failure<E>

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
    if (err instanceof Error) {
      return {
        error: err,
        data: null
      }
    }

    return {
      error: new Error(`Something went wrong ${ctx ? ctx : ''}`),
      data: null
    }
  }
}
