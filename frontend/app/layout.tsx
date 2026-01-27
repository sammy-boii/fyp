import type { Metadata } from 'next'
import {
  Geist,
  // IBM_Plex_Sans,
  // JetBrains_Mono,
  // Orbitron
  // Space_Grotesk
  // Space_Grotesk,
  // Inter,
  // JetBrains_Mono,
  // IBM_Plex_Sans,
  // Orbitron
} from 'next/font/google'
import './globals.css'
import Provider from '@/lib/provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

// const spaceGrotesk = Space_Grotesk({
//   variable: '--font-space-grotesk',
//   subsets: ['latin']
// })

// const jetbrainsMono = JetBrains_Mono({
//   variable: '--font-jetbrains-mono',
//   subsets: ['latin']
// })

// const ibmPlexSans = IBM_Plex_Sans({
//   variable: '--font-ibm-plex-sans',
//   weight: ['400', '500', '600', '700'],
//   subsets: ['latin']
// })

// const orbitron = Orbitron({
//   variable: '--font-orbitron',
//   subsets: ['latin']
// })

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
      <body className={`${geistSans.variable} antialiased`}>
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
