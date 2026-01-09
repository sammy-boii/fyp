import crypto from 'crypto'

const SECRET_KEY = Buffer.from(Bun.env.OAUTH_SECRET!, 'hex')

const ALGORITHM = 'aes-256-gcm'

if (SECRET_KEY.length !== 32) {
  throw new Error('OAUTH_SECRET must be a 32-byte (64 hex chars) key')
}

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv)

  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final()
  ])
  const authTag = cipher.getAuthTag()

  // Combine all parts into a single buffer: IV + AuthTag + CipherText
  const encryptedPayload = Buffer.concat([iv, authTag, encrypted])

  return encryptedPayload.toString('base64')
}

export function decryptToken(encryptedBase64: string): string {
  const data = Buffer.from(encryptedBase64, 'base64')

  const iv = data.subarray(0, 12)
  const authTag = data.subarray(12, 28)
  const encryptedText = data.subarray(28)

  const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final()
  ])

  return decrypted.toString('utf8')
}

/**
 * Decrypt Gmail credential access token
 */
export function decryptGmailToken(encryptedToken: string): string {
  return decryptToken(encryptedToken)
}
