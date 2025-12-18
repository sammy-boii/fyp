export const PORT = Bun.env.PORT || 5000

export const BACKEND_BASE_URL =
  Bun.env.NODE_ENV === 'production'
    ? `http://localhost:${PORT}`
    : `http://localhost:${PORT}`

export const FRONTEND_BASE_URL =
  Bun.env.NODE_ENV === 'production'
    ? `http://localhost:3000`
    : `http://localhost:3000`

export const GMAIL_API_BASE_URL = 'https://gmail.googleapis.com/gmail/v1'

export const API_ROUTES = {
  GMAIL: {
    GET_MESSAGES: GMAIL_API_BASE_URL + `/users/me/messages`,

    GET_MESSAGE: (id: string) =>
      GMAIL_API_BASE_URL + `/users/me/messages/${id}`,

    GET_ATTACHMENT: (messageId: string, attachmentId: string) =>
      GMAIL_API_BASE_URL +
      `/users/me/messages/${messageId}/attachments/${attachmentId}`
  }
}
