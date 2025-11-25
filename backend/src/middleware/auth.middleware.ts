import { prisma } from '@shared/db/prisma'
import { Context, Next } from 'hono'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { getCookie } from 'hono/cookie'

export const authMiddleware = async (c: Context, next: Next) => {
  // we up now😏
  const token = getCookie(c, 'token')

  if (!token) {
    return c.json({ error: 'JWT token not provided' }, 401)
  }

  try {
    const decoded = jwt.verify(
      token,
      Bun.env.JWT_SECRET as string
    ) as JwtPayload

    const findUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: decoded.id
      }
    })

    c.set('user', findUser)
    await next() // needs to be awaited
  } catch (err) {
    return c.json({ error: 'Invalid JWT token' }, 403)
  }
}
