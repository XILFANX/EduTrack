import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

import { NotificationPrompt } from '@/components/layout/notification-prompt'
import { PWARegistrar } from '@/components/pwa-registrar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'EduTrack — School Management Made Simple',
    template: '%s | EduTrack',
  },
  description:
    'Automate fee collection, grade tracking, and school operations. M-Pesa-first school management for Kenyan schools.',
  keywords: ['school management', 'fee collection', 'kenya', 'CBC', 'parent portal', 'teacher portal'],
  authors: [{ name: 'EduTrack' }],
  creator: 'EduTrack',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://edutrack.co.ke'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduTrack',
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'EduTrack',
    title: 'EduTrack — School Management Made Simple',
    description: 'Automate fee collection, grade tracking, and school operations. M-Pesa-first.',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/logo.jpeg" />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <NotificationPrompt />
          <PWARegistrar />
        </ThemeProvider>
      </body>
    </html>
  )
}
