'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AppearanceSettingsLoader() {
  useEffect(() => {
    loadAndApplySettings()
  }, [])

  const loadAndApplySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('preferences')
        .select('theme, font_size, animation_speed, reduce_motion, feed_density, haptic_feedback, language, date_format')
        .eq('user_id', user.id)
        .single()

      if (data) {
        applySettings({
          theme: data.theme || 'dark',
          font_size: data.font_size || 'medium',
          animation_speed: data.animation_speed || 'normal',
          reduce_motion: data.reduce_motion ?? false,
          feed_density: data.feed_density || 'normal',
          haptic_feedback: data.haptic_feedback ?? true,
          language: data.language || 'en',
          date_format: data.date_format || 'us'
        })
      }
    } catch (error) {
      // Use defaults if error
      console.error('Error loading appearance settings:', error)
    }
  }

  const applySettings = (settings: any) => {
    const root = document.documentElement

    // Apply theme
    if (settings.theme === 'light') {
      root.classList.add('light-mode')
      root.classList.remove('dark-mode')
    } else if (settings.theme === 'dark') {
      root.classList.add('dark-mode')
      root.classList.remove('light-mode')
    } else {
      // Auto mode - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark-mode')
        root.classList.remove('light-mode')
      } else {
        root.classList.add('light-mode')
        root.classList.remove('dark-mode')
      }
    }

    // Apply font size
    root.style.setProperty('--font-size-base',
      settings.font_size === 'small' ? '14px' :
      settings.font_size === 'large' ? '18px' : '16px'
    )

    // Apply animation speed
    if (settings.reduce_motion) {
      root.style.setProperty('--animation-speed', '0s')
      root.classList.add('reduce-motion')
    } else {
      root.style.setProperty('--animation-speed',
        settings.animation_speed === 'fast' ? '0.15s' :
        settings.animation_speed === 'slow' ? '0.6s' : '0.3s'
      )
      root.classList.remove('reduce-motion')
    }

    // Apply feed density
    root.setAttribute('data-feed-density', settings.feed_density || 'normal')
  }

  return null
}
