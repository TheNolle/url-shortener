import './globals.css'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Figtree } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'

const figtree = Figtree({ variable: '--font-sans', subsets: ['latin'] })
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'S',
  description: 'A production-ready URL shortener with advanced security, analytics, A/B testing, and health monitoring. Built with Next.js 16, PostgreSQL, Redis, and Docker.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%221em%22 font-size=%2280%22>🔗</text></svg>',
  }
}

export const dynamic = 'force-dynamic'

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang='en' suppressHydrationWarning>
        <body className={`${figtree.variable} ${geistSans.variable} ${geistMono.variable} antialiased dark`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
