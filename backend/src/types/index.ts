import { ContentfulStatusCode } from 'hono/utils/http-status'

export class AppError<T> extends Error {
  statusCode: ContentfulStatusCode
  details?: T

  constructor(message: string, statusCode: ContentfulStatusCode, details?: T) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.details = details
  }
}
