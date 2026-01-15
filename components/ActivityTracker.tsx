'use client'

import { useEffect } from 'react'
import { updateUserActivity } from '@/lib/profileUtils'

export default function ActivityTracker() {
  useEffect(() => {
    // Update activity on mount
    updateUserActivity()

    // Update activity every 30 seconds
    const interval = setInterval(() => {
      updateUserActivity()
    }, 30000)

    // Update activity on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateUserActivity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}

