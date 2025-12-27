'use server'

import { cookies } from 'next/headers'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { prisma } from '@shared/db/prisma'

// dto for data access layer

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    console.log('TOKEN', token)
    if (!token) {
      return null
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload

    console.log('PAYLOAD', payload)

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id
      },

      // relations are not included by default
      include: {
        workflows: true,
        credentials: true
      }
    })

    return user
  } catch {
    return null
  }
}
