'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { uploadCloudinaryImage } from '@/actions/cloudinary.actions'
import { toast } from 'sonner'

export default function UploadPage() {
  const [imageUrl, setImageUrl] = useState('')

  const [isPending, startTransition] = useTransition()

  async function handleUpload(evt: React.ChangeEvent<HTMLInputElement>) {
    console.log('EVENT', evt)
    const file = evt.target.files?.[0]
    if (!file) return

    console.log('FILE', file)

    startTransition(async () => {
      const { data, error } = await uploadCloudinaryImage(file)

      if (error) {
        toast.error(error.message)
        return
      }

      console.log('DATA', data)
      console.log('ERROR', error)
      setImageUrl(data.url as string)
    })
  }

  return (
    <div className='space-y-4'>
      <input type='file' accept='image/*' onChange={handleUpload} />
      {isPending && <p>Uploading...</p>}
      {imageUrl && (
        <Image
          src={imageUrl}
          alt='Uploaded'
          className='w-64 rounded'
          width={300}
          height={300}
        />
      )}
    </div>
  )
}
