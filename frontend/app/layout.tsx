import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import Provider from '@/lib/provider'

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
      <body className={`${spaceGrotesk.className} antialiased`}>
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
