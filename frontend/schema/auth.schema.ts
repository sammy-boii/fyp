import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(12, 'Must be at least 12 characters long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/\d/, 'Must contain at least one number')
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      'Must contain at least one special character'
    )
})

export const signupFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().email(),
    password: z
      .string()
      .min(12, 'Must be at least 12 characters long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/\d/, 'Must contain at least one number')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Must contain at least one special character'
      ),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword']
  })

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(12, 'Must be at least 12 characters long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/\d/, 'Must contain at least one number')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Must contain at least one special character'
      ),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword']
  })