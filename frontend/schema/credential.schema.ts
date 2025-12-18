import { z } from 'zod'

export const updateCredentialSchema = z
  .string()
  .trim()
  .min(1)
  .optional()
  .nullable()
