'use server'

import { getCurrentUser } from '@/data/dal'
import { tryCatch } from '@/lib/utils'
import { prisma } from '@shared/db/prisma'
import bcrypt from 'bcrypt'
import { resetPasswordSchema } from '@/schema/auth.schema'
import { TResetPasswordForm } from '@/types/auth.types'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { z } from 'zod'

export async function getProfile() {
  return tryCatch(async () => {
    const user = await getCurrentUser()
    return user
  })
}

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  avatar: z
    .string()
    .url('Avatar must be a valid URL')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val : null))
})

type TUpdateProfile = z.infer<typeof updateProfileSchema>

export async function updateProfile(data: TUpdateProfile) {
  return tryCatch(async () => {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      throw new Error('Not authenticated')
    }

    const parsedData = updateProfileSchema.parse(data)

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: parsedData.name,
        avatar: parsedData.avatar ?? undefined
      }
    })

    return updatedUser
  })
}

const changePasswordSchema = z.object({
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

type TChangePassword = z.infer<typeof changePasswordSchema>

export async function changePassword(data: TChangePassword) {
  return tryCatch(async () => {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      throw new Error('Not authenticated')
    }

    const parsedData = changePasswordSchema.parse(data)

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      omit: {
        password: false
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isPasswordValid = await bcrypt.compare(
      parsedData.currentPassword,
      user.password
    )

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    const hashedPassword = await bcrypt.hash(parsedData.newPassword, 10)

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        password: hashedPassword
      }
    })
  })
}

export async function resetPassword(data: TResetPasswordForm) {
  return tryCatch(async () => {
    const parsedData = resetPasswordSchema.parse(data)

    let email: string
    try {
      const payload = jwt.verify(
        parsedData.token,
        process.env.JWT_SECRET as string
      ) as JwtPayload
      email = payload.email as string
    } catch {
      throw new Error('Invalid or expired reset link')
    }

    const user = await prisma.user.findUnique({
      where: { email },
      omit: {
        password: false
      }
    })

    if (!user) {
      throw new Error('User by that email not found')
    }

    const hashedPassword = await bcrypt.hash(parsedData.password, 10)

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword
      }
    })
  })
}
