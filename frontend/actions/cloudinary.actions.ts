'use server'

import { tryCatch } from '@/lib/utils'
import crypto from 'crypto'

export async function getCloudinarySignature() {
  const timestamp = Math.floor(Date.now() / 1000)

  // params that Cloudinary will sign
  const paramsToSign = `timestamp=${timestamp}&upload_preset=${process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}`

  const signature = crypto
    .createHash('sha256')
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex')

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
  }
}

export async function uploadCloudinaryImage(file: File) {
  return tryCatch(async () => {
    const sig = await getCloudinarySignature()

    const formData = new FormData()
    formData.append('file', file)
    formData.append('timestamp', sig.timestamp.toString())
    formData.append('signature', sig.signature)
    formData.append('api_key', sig.apiKey)
    formData.append('upload_preset', sig.uploadPreset)

    // Step 3: upload to Cloudinary
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      { method: 'POST', body: formData }
    )

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to upload image')
    }
    return data
  })
}
