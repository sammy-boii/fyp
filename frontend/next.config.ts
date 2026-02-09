import type { NextConfig } from 'next'
import { FRONTEND_BASE_URL, WS_BASE_URL } from './constants'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              connect-src 'self' ${WS_BASE_URL} ${FRONTEND_BASE_URL};
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline';
            `.replace(/\n/g, ' ')
          }
        ]
      }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb' // temp (hopefully)
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**'
      }
    ]
  }
}

export default nextConfig
