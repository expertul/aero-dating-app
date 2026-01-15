'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Palette, Type, Zap, Eye, Layout, Smartphone, Globe, Calendar, Check } from 'lucide-react'

type Theme = 'dark' | 'light' | 'auto'
type FontSize = 'small' | 'medium' | 'large'
type AnimationSpeed = 'fast' | 'normal' | 'slow'
type FeedDensity = 'compact' | 'normal' | 'spacious'
type DateFormat = 'us' | 'eu' | 'iso'

interface AppearanceSettings {
  theme: Theme
  font_size: FontSize
  animation_speed: AnimationSpeed
  reduce_motion: boolean
  feed_density: FeedDensity
  haptic_feedback: boolean
  language: string
  date_format: DateFormat
}

export default function AppearanceSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'dark',
    font_size: 'medium',
    animation_speed: 'normal',
    reduce_motion: false,
    feed_density: 'normal',
    haptic_feedback: true,
    language: 'en',
    date_format: 'us'
  })
  const [originalSettings, setOriginalSettings] = useState<AppearanceSettings>(settings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data } = await supabase
        .from('preferences')
        .select('theme, font_size, animation_speed, reduce_motion, feed_density, haptic_feedback, language, date_format')
        .eq('user_id', user.id)
        .single()

      const loadedSettings: AppearanceSettings = {
        theme: (data?.theme as Theme) || 'dark',
        font_size: (data?.font_size as FontSize) || 'medium',
        animation_speed: (data?.animation_speed as AnimationSpeed) || 'normal',
        reduce_motion: data?.reduce_motion ?? false,
        feed_density: (data?.feed_density as FeedDensity) || 'normal',
        haptic_feedback: data?.haptic_feedback ?? true,
        language: data?.language || 'en',
        date_format: (data?.date_format as DateFormat) || 'us'
      }

      setSettings(loadedSettings)
      setOriginalSettings(loadedSettings)
      applySettings(loadedSettings)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const applySettings = (newSettings: AppearanceSettings) => {
    // Apply theme
    const root = document.documentElement
    if (newSettings.theme === 'light') {
      root.classList.add('light-mode')
      root.classList.remove('dark-mode')
    } else if (newSettings.theme === 'dark') {
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
      newSettings.font_size === 'small' ? '14px' :
      newSettings.font_size === 'large' ? '18px' : '16px'
    )

    // Apply animation speed
    root.style.setProperty('--animation-speed',
      newSettings.animation_speed === 'fast' ? '0.15s' :
      newSettings.animation_speed === 'slow' ? '0.6s' : '0.3s'
    )

    // Apply reduce motion
    if (newSettings.reduce_motion) {
      root.style.setProperty('--animation-speed', '0s')
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Apply feed density
    root.setAttribute('data-feed-density', newSettings.feed_density)
  }

  const updateSetting = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    setHasChanges(true)
    setSaved(false)
    applySettings(newSettings)
  }

  const saveSettings = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('preferences')
        .upsert({
          user_id: user.id,
          theme: settings.theme,
          font_size: settings.font_size,
          animation_speed: settings.animation_speed,
          reduce_motion: settings.reduce_motion,
          feed_density: settings.feed_density,
          haptic_feedback: settings.haptic_feedback,
          language: settings.language,
          date_format: settings.date_format
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setOriginalSettings(settings)
      setHasChanges(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const cancelChanges = () => {
    setSettings(originalSettings)
    setHasChanges(false)
    setSaved(false)
    applySettings(originalSettings)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-dark-bg text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="safe-top px-4 py-3 flex items-center gap-3 border-b border-dark-border flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="p-1.5 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Appearance & Display</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Theme */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-primary-red" />
            <h2 className="text-lg font-semibold">Theme</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['dark', 'light', 'auto'] as Theme[]).map((theme) => (
              <button
                key={theme}
                onClick={() => updateSetting('theme', theme)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  settings.theme === theme
                    ? 'border-primary-red bg-primary-red/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="text-sm font-medium capitalize mb-1">{theme}</div>
                <div className="text-xs text-gray-400">
                  {theme === 'auto' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
                </div>
                {settings.theme === theme && (
                  <Check className="w-4 h-4 text-primary-red mt-2 mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-5 h-5 text-primary-blue" />
            <h2 className="text-lg font-semibold">Font Size</h2>
          </div>
          <div className="space-y-2">
            {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => updateSetting('font_size', size)}
                className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                  settings.font_size === size
                    ? 'border-primary-blue bg-primary-blue/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`font-medium ${
                    size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-base'
                  }`}>
                    Sample Text
                  </div>
                </div>
                <div className="text-sm capitalize">{size}</div>
                {settings.font_size === size && (
                  <Check className="w-5 h-5 text-primary-blue" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Animation Speed */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary-turquoise" />
            <h2 className="text-lg font-semibold">Animation Speed</h2>
          </div>
          <div className="space-y-2">
            {(['fast', 'normal', 'slow'] as AnimationSpeed[]).map((speed) => (
              <button
                key={speed}
                onClick={() => updateSetting('animation_speed', speed)}
                className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                  settings.animation_speed === speed
                    ? 'border-primary-turquoise bg-primary-turquoise/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="text-sm font-medium capitalize">{speed}</div>
                {settings.animation_speed === speed && (
                  <Check className="w-5 h-5 text-primary-turquoise" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility */}
        <div className="glass rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-primary-turquoise" />
            <h2 className="text-lg font-semibold">Accessibility</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Reduce Motion</div>
              <div className="text-xs text-gray-400">Minimize animations and transitions</div>
            </div>
            <button
              onClick={() => updateSetting('reduce_motion', !settings.reduce_motion)}
              className={`w-14 h-7 rounded-full transition-colors ${
                settings.reduce_motion ? 'gradient-turquoise' : 'bg-gray-600'
              }`}
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full shadow-lg"
                animate={{ x: settings.reduce_motion ? 28 : 2, y: 0.5 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        {/* Feed Density */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Layout className="w-5 h-5 text-primary-blue" />
            <h2 className="text-lg font-semibold">Feed Density</h2>
          </div>
          <div className="space-y-2">
            {(['compact', 'normal', 'spacious'] as FeedDensity[]).map((density) => (
              <button
                key={density}
                onClick={() => updateSetting('feed_density', density)}
                className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                  settings.feed_density === density
                    ? 'border-primary-blue bg-primary-blue/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="text-sm font-medium capitalize">{density}</div>
                {settings.feed_density === density && (
                  <Check className="w-5 h-5 text-primary-blue" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Haptic Feedback */}
        <div className="glass rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-primary-red" />
            <h2 className="text-lg font-semibold">Haptic Feedback</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Vibration</div>
              <div className="text-xs text-gray-400">Vibrate on interactions</div>
            </div>
            <button
              onClick={() => updateSetting('haptic_feedback', !settings.haptic_feedback)}
              className={`w-14 h-7 rounded-full transition-colors ${
                settings.haptic_feedback ? 'gradient-red' : 'bg-gray-600'
              }`}
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full shadow-lg"
                animate={{ x: settings.haptic_feedback ? 28 : 2, y: 0.5 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-primary-turquoise" />
            <h2 className="text-lg font-semibold">Language</h2>
          </div>
          <select
            value={settings.language}
            onChange={(e) => updateSetting('language', e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary-turquoise"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
          </select>
        </div>

        {/* Date Format */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary-blue" />
            <h2 className="text-lg font-semibold">Date Format</h2>
          </div>
          <div className="space-y-2">
            {([
              { value: 'us', label: 'US (MM/DD/YYYY)', example: '12/25/2024' },
              { value: 'eu', label: 'European (DD/MM/YYYY)', example: '25/12/2024' },
              { value: 'iso', label: 'ISO (YYYY-MM-DD)', example: '2024-12-25' }
            ] as { value: DateFormat; label: string; example: string }[]).map((format) => (
              <button
                key={format.value}
                onClick={() => updateSetting('date_format', format.value)}
                className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                  settings.date_format === format.value
                    ? 'border-primary-blue bg-primary-blue/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{format.label}</div>
                  <div className="text-xs text-gray-400">{format.example}</div>
                </div>
                {settings.date_format === format.value && (
                  <Check className="w-5 h-5 text-primary-blue" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pb-4 space-y-3">
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center text-primary-turquoise text-sm font-medium"
              >
                ✓ Settings saved!
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex gap-2">
            <motion.button
              onClick={saveSettings}
              disabled={!hasChanges || saving}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white ${
                hasChanges ? 'gradient-red' : 'bg-gray-600 cursor-not-allowed'
              }`}
              whileTap={hasChanges ? { scale: 0.98 } : {}}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>

            {hasChanges && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={cancelChanges}
                className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm"
              >
                Cancel
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
