'use server'

import { getCurrentUser } from '@/data/dal'
import { tryCatch } from '@/lib/utils'
import { prisma } from '@shared/db/prisma'
import bcrypt from 'bcrypt'
import { TResetPasswordForm } from '@/types/auth.types'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { TChangePassword, TUpdateProfile } from '@/types/user.types'
import {
  changePasswordSchema,
  resetPasswordSchema,
  updateProfileSchema
} from '@/schema/user.schema'

export async function getProfile() {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('User not found')
    }

    return {
      ...user,
      workflows: user.workflows,
      credentials: user.credentials
    }
  })
}

export async function updateProfile(data: TUpdateProfile) {
  return tryCatch(async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const parsedData = updateProfileSchema.parse(data)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsedData.name,
        avatar: parsedData.avatar ?? null
      }
    })

    return updatedUser
  })
}

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
