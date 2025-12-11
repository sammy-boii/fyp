import { changePasswordSchema, updateProfileSchema } from '@/schema/user.schema'
import { z } from 'zod'

export type TUpdateProfile = z.infer<typeof updateProfileSchema>
export type TChangePassword = z.infer<typeof changePasswordSchema>
