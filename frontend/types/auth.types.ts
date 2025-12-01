import { loginSchema, signupFormSchema, resetPasswordSchema } from '@/schema/auth.schema'
import { z } from 'zod'

export type TSignUpForm = z.infer<typeof signupFormSchema>
export type TLoginForm = z.infer<typeof loginSchema>
export type TResetPasswordForm = z.infer<typeof resetPasswordSchema>
