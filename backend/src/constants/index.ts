export const PORT = Bun.env.PORT || 5000

export const BACKEND_BASE_URL =
  Bun.env.NODE_ENV === 'production'
    ? `http://localhost:${PORT}`
    : `http://localhost:${PORT}`

export const FRONTEND_BASE_URL =
  Bun.env.NODE_ENV === 'production'
    ? `http://localhost:3000`
    : `http://localhost:3000`

const GMAIL_API_BASE_URL = 'https://gmail.googleapis.com/gmail/v1'

const GOOGLE_OAUTH_BASE_URL = 'https://oauth2.googleapis.com'

const GOOGLE_DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3'

const DISCORD_API_BASE_URL = 'https://discord.com/api/v10'

export const API_ROUTES = {
  GMAIL: {
    GET_MESSAGES: GMAIL_API_BASE_URL + `/users/me/messages`,

    GET_MESSAGE: (id: string) =>
      GMAIL_API_BASE_URL + `/users/me/messages/${id}`,

    GET_ATTACHMENT: (messageId: string, attachmentId: string) =>
      GMAIL_API_BASE_URL +
      `/users/me/messages/${messageId}/attachments/${attachmentId}`,

    SEND_MESSAGE: GMAIL_API_BASE_URL + `/users/me/messages/send`,

    // Gmail Push Notifications
    WATCH: GMAIL_API_BASE_URL + `/users/me/watch`,
    STOP_WATCH: GMAIL_API_BASE_URL + `/users/me/stop`,
    HISTORY_LIST: (startHistoryId: string) =>
      GMAIL_API_BASE_URL +
      `/users/me/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded`
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

  // Google
  OAUTH: {
    REFRESH_TOKEN: GOOGLE_OAUTH_BASE_URL + '/token'
  },

  DISCORD: {
    GET_CHANNEL_MESSAGES: (channelId: string) =>
      DISCORD_API_BASE_URL + `/channels/${channelId}/messages`,
    LIST_GUIDS: (limit: number) =>
      DISCORD_API_BASE_URL + `/users/@me/guilds?limit=${limit}`,
    LIST_CHANNELS: (guildId: string) =>
      DISCORD_API_BASE_URL + `/guilds/${guildId}/channels`,
    CREATE_CHANNEL: (guildId: string) =>
      DISCORD_API_BASE_URL + `/guilds/${guildId}/channels`,
    CREATE_DM_CHANNEL: DISCORD_API_BASE_URL + `/users/@me/channels`,
    SEND_DM: (channelId: string) =>
      DISCORD_API_BASE_URL + `/channels/${channelId}/messages`
  }
}
