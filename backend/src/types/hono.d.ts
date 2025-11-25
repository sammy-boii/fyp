import { User } from '@shared/prisma/generated/prisma'
import 'hono'

declare module 'hono' {
  interface ContextVariableMap {
    user: Omit<User, 'password'>
  }
}
