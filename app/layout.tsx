import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ActivityTracker from '@/components/ActivityTracker'
import BotQueueProcessor from '@/components/BotQueueProcessor'
import FloatingActionButton from '@/components/FloatingActionButton'
import AppearanceSettingsLoader from '@/components/AppearanceSettingsLoader'
import AndroidBackHandler from '@/components/AndroidBackHandler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AERO - Modern Dating',
  description: 'Find meaningful connections with AERO, the smart dating app',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FF2D55',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-dark-bg text-white antialiased`}>
        <AndroidBackHandler />
        <AppearanceSettingsLoader />
        <ActivityTracker />
        <BotQueueProcessor />
        <FloatingActionButton />
        {children}
      </body>
    </html>
  )
}

