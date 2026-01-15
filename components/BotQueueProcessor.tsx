'use client'

// Component to automatically process bot message queue
// Runs every 10 seconds to send scheduled bot messages

import { useEffect, useRef } from 'react'

export default function BotQueueProcessor() {
  useEffect(() => {
    const lastErrorAt = { current: 0 }
    const cooldownMs = 60 * 1000
    const intervalMs = 10 * 1000

    // Process bot queue immediately
    const processQueue = async () => {
      try {
        if (Date.now() - lastErrorAt.current < cooldownMs) {
          return
        }
        const response = await fetch('/api/bot-process', {
          method: 'GET',
          cache: 'no-store'
        })
        if (!response.ok) {
          lastErrorAt.current = Date.now()
          console.error('[BotQueueProcessor] API error:', response.status)
        }
      } catch (error) {
        lastErrorAt.current = Date.now()
        console.error('[BotQueueProcessor] Error processing queue:', error)
      }
    }

    // Process immediately
    processQueue()

    // Then process every 10 seconds, with cooldown on errors
    const interval = setInterval(processQueue, intervalMs)

    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}

