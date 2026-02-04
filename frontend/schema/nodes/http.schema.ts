import { z } from 'zod'

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
} as const

export type HTTPMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS]

export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
  TEXT: 'text/plain',
  XML: 'application/xml'
} as const

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES]

export const headerSchema = z.object({
  key: z.string().min(1, 'Header key is required'),
  value: z.string()
})

export const queryParamSchema = z.object({
  key: z.string().min(1, 'Parameter key is required'),
  value: z.string()
})

export const httpRequestFormSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  url: z.string().min(1, 'URL is required'),
  headers: z.array(headerSchema).optional().default([]),
  queryParams: z.array(queryParamSchema).optional().default([]),
  contentType: z
    .enum([
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain',
      'application/xml'
    ])
    .optional()
    .default('application/json'),
  body: z.string().optional().default('')
})

export type Header = z.infer<typeof headerSchema>
export type QueryParam = z.infer<typeof queryParamSchema>
export type HTTPRequestFormData = z.infer<typeof httpRequestFormSchema>
