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

export const GOOGLE_OAUTH_BASE_URL = 'https://oauth2.googleapis.com'

export const GOOGLE_DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3'

export const API_ROUTES = {
  GMAIL: {
    GET_MESSAGES: GMAIL_API_BASE_URL + `/users/me/messages`,

    GET_MESSAGE: (id: string) =>
      GMAIL_API_BASE_URL + `/users/me/messages/${id}`,

    GET_ATTACHMENT: (messageId: string, attachmentId: string) =>
      GMAIL_API_BASE_URL +
      `/users/me/messages/${messageId}/attachments/${attachmentId}`,

    SEND_MESSAGE: GMAIL_API_BASE_URL + `/users/me/messages/send`
  },

  GOOGLE_DRIVE: {
    LIST_FILES: GOOGLE_DRIVE_API_BASE_URL + '/files',
    CREATE_FILE: GOOGLE_DRIVE_API_BASE_URL + '/files',
    GET_FILE: (fileId: string) =>
      GOOGLE_DRIVE_API_BASE_URL + `/files/${fileId}`,
    GET_FILE_CONTENT: (fileId: string) =>
      GOOGLE_DRIVE_API_BASE_URL + `/files/${fileId}?alt=media`,
    EXPORT_FILE: (fileId: string, mimeType: string) =>
      GOOGLE_DRIVE_API_BASE_URL +
      `/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`,
    DELETE_FILE: (fileId: string) =>
      GOOGLE_DRIVE_API_BASE_URL + `/files/${fileId}`
  },

  OAUTH: {
    REFRESH_TOKEN: GOOGLE_OAUTH_BASE_URL + '/token'
  }
}
