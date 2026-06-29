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
    default: 'EstateTrack — Property Management Made Simple',
    template: '%s | EstateTrack',
  },
  description:
    'Automate rent collection, tenant tracking, and maintenance management. M-Pesa-first property management for Kenyan landlords.',
  keywords: ['property management', 'rent collection', 'landlord', 'kenya', 'tenant portal'],
  authors: [{ name: 'EstateTrack' }],
  creator: 'EstateTrack',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://estatetrack.co.ke'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EstateTrack',
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'EstateTrack',
    title: 'EstateTrack — Property Management Made Simple',
    description: 'Automate rent collection, tenant tracking, and maintenance. M-Pesa-first.',
  },
}

export const viewport: Viewport = {
  themeColor: '#9333ea',
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
        <link rel="apple-touch-icon" href="/EstateTrack.png" />
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
