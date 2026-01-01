import { z } from 'zod'

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

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  avatar: z
    .string()
    .url('Avatar must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val ? val : null)) // standardize falsy values to null
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/\d/, 'Must contain at least one number')
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      'Must contain at least one special character'
    )
})
