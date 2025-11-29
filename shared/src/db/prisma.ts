import 'dotenv/config'
import { PrismaClient } from '../prisma/generated/prisma'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}
const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaNeon({ connectionString })

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    omit: {
      user: {
        password: true // globally omit
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
