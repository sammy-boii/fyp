import { BACKEND_BASE_URL } from '.'

export const REDIRECT_URL = {
  GMAIL: {
    OAUTH: BACKEND_BASE_URL + '/api/gmail/oauth/callback'
  },
  'GOOGLE-DRIVE': {
    OAUTH: BACKEND_BASE_URL + '/api/google-drive/oauth/callback'
  },
  'GOOGLE-DOCS': {
    OAUTH: BACKEND_BASE_URL + '/api/google-docs/oauth/callback'
  },
  'GOOGLE-CALENDAR': {
    OAUTH: BACKEND_BASE_URL + '/api/google-calendar/oauth/callback'
  },
  YOUTUBE: {
    OAUTH: BACKEND_BASE_URL + '/api/youtube/oauth/callback'
  }
}
