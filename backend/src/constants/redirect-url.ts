import { BACKEND_BASE_URL } from '.'

export const REDIRECT_URL = {
  GMAIL: {
    OAUTH: BACKEND_BASE_URL + '/api/gmail/oauth/callback'
  },
  DRIVE: {
    OAUTH: BACKEND_BASE_URL + '/api/google-drive/oauth/callback'
  }
}
