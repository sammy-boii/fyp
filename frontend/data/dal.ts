'use server'

import { cookies } from 'next/headers'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { prisma } from '@shared/db/prisma'

// dto for data access layer

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (token) {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id: payload.id
        }
      })

      return user
    }
  } catch (err) {
    throw err
  }
}
