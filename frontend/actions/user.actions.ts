'use server'

import { getCurrentUser } from '@/data/dal'
import { tryCatch } from '@/lib/utils'
import { prisma } from '@shared/db/prisma'
import bcrypt from 'bcrypt'
import { resetPasswordSchema } from '@/schema/auth.schema'
import { TResetPasswordForm } from '@/types/auth.types'
import jwt, { JwtPayload } from 'jsonwebtoken'

export async function getProfile() {
  return tryCatch(async () => {
    const user = await getCurrentUser()
    return user
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
