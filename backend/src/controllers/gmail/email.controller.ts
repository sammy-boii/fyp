import { API_ROUTES } from '@/src/constants'
import { extractGmailMessageContent } from '@/src/helper/gmail-helper'
import { tryCatch } from '@/src/lib/utils'
import { AppError } from '@/src/types'
import { Context } from 'hono'

const token = ``

export const getEmails = tryCatch(async (c: Context) => {
  const messageListRes = await fetch(`${API_ROUTES.GMAIL.GET_MESSAGES}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!messageListRes.ok) {
    const err = await messageListRes.json()
    throw new AppError(
      err?.error?.message || JSON.stringify(err.error),
      400,
      err.error
    )
  }

  const messageList = await messageListRes.json()

  const messages = await Promise.all(
    (messageList?.messages || []).map(async (msg: any) => {
      const res = await fetch(API_ROUTES.GMAIL.GET_MESSAGE(msg.id), {
        headers: { Authorization: `Bearer ${token}` }
      })
      const message = await res.json()

      // Recursive extraction, including attachments
      const { body, attachments } = await extractGmailMessageContent(
        message.id,
        message.payload,
        token
      )

      const headers = message.payload.headers || []
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
          ?.value || ''

      return {
        id: message.id,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        date: getHeader('Date'),
        body,
        attachments
      }
    })
  )

  console.log('MESSAGES', messages)
  return messages
})
