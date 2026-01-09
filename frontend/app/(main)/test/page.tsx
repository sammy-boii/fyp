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
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMessage, setSendMessage] = useState('')

  useEffect(() => {
    fetch('http://localhost:5000/api/gmail/messages', {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => setEmails(data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!to || !subject || !body) {
      setSendMessage('Please fill in all fields')
      return
    }

    setSending(true)
    setSendMessage('')

    try {
      const res = await fetch('http://localhost:5000/api/gmail/messages/send', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          subject,
          body
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setSendMessage('Error: ' + (data.message || 'Failed to send email'))
        return
      }

      setSendMessage('Email sent successfully!')
      setTo('')
      setSubject('')
      setBody('')
    } catch (error) {
      setSendMessage(
        'Error: ' + (error instanceof Error ? error.message : 'Unknown error')
      )
    } finally {
      setSending(false)
    }
  }

  console.log(emails)

  if (loading) return <p className='text-center mt-10'>Loading emails...</p>

  return (
    <div className='p-6 max-w-5xl mx-auto'>
      <h1 className='text-3xl font-bold mb-6'>Gmail Messages</h1>

      {/* Send Email Form */}
      <div className='bg-white dark:bg-gray-800 border rounded-md p-6 mb-8 shadow-sm'>
        <h2 className='text-2xl font-bold mb-4'>Send Email</h2>
        <form onSubmit={handleSendEmail} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>To:</label>
            <input
              type='email'
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder='recipient@example.com'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
              disabled={sending}
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Subject:</label>
            <input
              type='text'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='Email subject'
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
              disabled={sending}
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Body:</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='Email body'
              rows={5}
              className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
              disabled={sending}
            />
          </div>

          <button
            type='submit'
            disabled={sending}
            className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400'
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>

          {sendMessage && (
            <p
              className={`mt-2 text-sm ${
                sendMessage.includes('Error')
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}
            >
              {sendMessage}
            </p>
          )}
        </form>
      </div>

      {/* Emails List */}
      {emails.length === 0 ? (
        <p className='text-center text-gray-500'>No emails found</p>
      ) : (
        <>
          <h2 className='text-2xl font-bold mb-4'>Inbox ({emails.length})</h2>
          {emails.map((email, i) => {
            return (
              <div
                key={i}
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
                          downloadAttachment(
                            att.data,
                            att.mimeType,
                            att.filename
                          )
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
        </>
      )}
    </div>
  )
}
