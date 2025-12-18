import { credentialSchema } from '@/schema/credential.schema'
import { z } from 'zod'

export type TCredential = z.infer<typeof credentialSchema>
