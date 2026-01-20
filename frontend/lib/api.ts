import ky, { KyInstance } from 'ky'
import { cookies } from 'next/headers'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/'

export const api: KyInstance = ky.create({
  prefixUrl: BACKEND_URL,
  timeout: 10000,
  retry: {
    limit: 1,
    methods: ['get', 'put', 'head', 'delete', 'options', 'trace'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504]
  },
  hooks: {
    beforeRequest: [
      async (req) => {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value
        if (token) {
          req.headers.set('Authorization', `Bearer ${token}`)
        }
      }
    ],
    afterResponse: [
      async (_req, _options, res) => {
        if (!res.ok) {
          const contentType = res.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const errorData = await res.clone().json()
            throw new Error(errorData.error)
          } else {
            const errorMsg = await res.clone().text()
            throw new Error(errorMsg)
          }
        }
      }
    ]
  }
})
