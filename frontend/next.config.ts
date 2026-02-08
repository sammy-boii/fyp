import type { NextConfig } from 'next'

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
              connect-src 'self' wss://flux-backend-r3tv.onrender.com https://flux-frontend-pearl.vercel.app;
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
