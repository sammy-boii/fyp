
import ky from 'ky'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/'

console.log("BACKEND_URL", BACKEND_URL)

export const api = ky.create({
  prefixUrl: BACKEND_URL,
  timeout: 10000,
  retry: {
    limit: 1,
    methods: ['get', 'put', 'head', 'delete', 'options', 'trace'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504]
  },
  hooks: {
    beforeRequest: [
      async (request) => {
        try {
          const cookieStore = await cookies()
          const token = cookieStore.get('token')?.value
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`)
          }
        } catch (error) {
          console.warn('Could not attach token in the API client:', error)
        }
      }
    ]
  }
})
