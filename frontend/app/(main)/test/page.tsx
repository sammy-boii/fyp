// pages/gmail.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

function base64UrlToBase64(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  return base64
}

function extractActualImageData(encodedData: string): string {
  try {
    // First, decode the base64 to see if it's a JSON object
    const decoded = atob(encodedData)

    // Check if it looks like JSON
    if (decoded.trim().startsWith('{')) {
      const jsonData = JSON.parse(decoded)
      // Extract the actual image data from the nested structure
      return jsonData.data || encodedData
    }

    // If not JSON, return as-is
    return encodedData
  } catch (error) {
    console.error('Error extracting image data:', error)
    return encodedData
  }
}

function downloadAttachment(data: string, mimeType: string, filename: string) {
  try {
    // Extract actual image data if it's wrapped in JSON
    const actualData = extractActualImageData(data)
    const fixedBase64 = base64UrlToBase64(actualData)
    const byteCharacters = atob(fixedBase64)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => URL.revokeObjectURL(url), 100)
  } catch (error) {
    console.error('Download failed:', error)
  }
}

type Attachment = {
  filename: string
  mimeType: string
  data: string
}

type Email = {
  id: string
  subject: string
  from: string
  date: string
  body: string
  attachments?: Attachment[]
}

export default function GmailPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:5000/api/gmail/messages', {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => setEmails(data.data || []))
      .finally(() => setLoading(false))
  }, [])

  console.log(emails)

  if (loading) return <p className='text-center mt-10'>Loading emails...</p>

  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <h1 className='text-3xl font-bold mb-6'>Gmail Messages</h1>

      {emails.map((email) => {
        return (
          <div
            key={email.id}
            className='border rounded-md p-4 mb-6 shadow-sm bg-white dark:bg-gray-800'
          >
            <div className='mb-2'>
              <p className='font-semibold'>Subject: {email.subject}</p>
              <p className='text-sm text-gray-500 dark:text-gray-300'>
                From: {email.from}
              </p>
              <p className='text-sm text-gray-500 dark:text-gray-300'>
                Date: {new Date(email.date).toLocaleString()}
              </p>
            </div>

            <div
              className='prose dark:prose-invert mb-4'
              dangerouslySetInnerHTML={{ __html: email.body }}
            />

            {(email.attachments || []).map((att, idx) => {
              // Extract actual image data if wrapped in JSON
              const actualData = extractActualImageData(att.data)
              const fixedBase64 = base64UrlToBase64(actualData)
              const dataUrl = `data:${att.mimeType};base64,${fixedBase64}`
              const isImage = att.mimeType.startsWith('image/')

              return (
                <div key={idx} className='flex flex-col items-start mb-4'>
                  {isImage ? (
                    <img
                      src={dataUrl}
                      alt={att.filename}
                      className='max-w-xs max-h-48 border rounded mb-2'
                      onError={(e) => {
                        console.error('Image load error for:', att.filename)
                        console.log('MIME type:', att.mimeType)
                        console.log(
                          'Actual data (first 50):',
                          actualData.substring(0, 50)
                        )
                      }}
                    />
                  ) : (
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                      {att.filename}
                    </p>
                  )}

                  <button
                    onClick={() =>
                      downloadAttachment(att.data, att.mimeType, att.filename)
                    }
                    className='px-3 py-2 border rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm cursor-pointer'
                  >
                    Download {att.filename}
                  </button>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
