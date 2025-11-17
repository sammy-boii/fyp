import path from 'path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.resolve(__dirname, 'src/prisma/schema.prisma'),
  migrations: {
    path: path.resolve(__dirname, 'src/db/migrations')
  }
})
