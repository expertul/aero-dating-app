'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { App as CapacitorApp } from '@capacitor/app'

export default function AndroidBackHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only run on mobile
    if (typeof window === 'undefined') return

    let backButtonListener: any

    const setupBackButton = async () => {
      try {
        backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          // Routes where back button should close app
          const closeAppRoutes = ['/feed', '/auth', '/']

          if (closeAppRoutes.includes(pathname || '')) {
            // On main screens, minimize app instead of closing
            CapacitorApp.minimizeApp()
          } else {
            // On other screens, navigate back
            if (canGoBack) {
              router.back()
            } else {
              // If can't go back, go to feed
              router.push('/feed')
            }
          }
        })
      } catch (error) {
        // Not on mobile or error setting up listener
        console.log('[AndroidBackHandler] Not on mobile or error:', error)
      }
    }

    setupBackButton()

    return () => {
      if (backButtonListener) {
        backButtonListener.remove()
      }
    }
  }, [pathname, router])

  return null
}
