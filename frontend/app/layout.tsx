import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import Provider from '@/lib/provider'

const accentBootstrapScript = `
  (() => {
    try {
      const key = 'app-accent-color'
      const stored = localStorage.getItem(key)
      if (!stored) return
      const value = stored.trim()
      const hexColorRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
      if (!hexColorRegex.test(value)) return
      const root = document.documentElement
      root.style.setProperty('--primary', value)
      root.style.setProperty('--sidebar-primary', value)
    } catch {}
  })();
`

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Flux | Automation Application',
  description: 'HEHEHEHEHAW'
}

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <script
          id='accent-bootstrap'
          dangerouslySetInnerHTML={{ __html: accentBootstrapScript }}
        />
      </head>
      <body className={`${spaceGrotesk.className} antialiased`}>
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
