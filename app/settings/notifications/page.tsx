'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { motion } from 'framer-motion'
import { ArrowLeft, Bell, MessageCircle, Heart, Eye, Check } from 'lucide-react'

export default function NotificationsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    newMatches: true,
    newMessages: true,
    likesReceived: true,
    profileViews: true,
    superLikes: true,
    matchActivity: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
    frequency: 'realtime' as 'realtime' | 'hourly' | 'daily',
    soundEnabled: true,
    vibrationEnabled: true,
    badgeCounts: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

      // Load from database if exists
      const { data } = await supabase
        .from('preferences')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single()

      if (data?.notification_preferences) {
        setSettings({ ...settings, ...data.notification_preferences })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('preferences')
        .upsert({
          user_id: user.id,
          notification_preferences: settings
        }, {
          onConflict: 'user_id'
        })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
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
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Notification Categories */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Notification Types</h2>
          
          {[
            { key: 'newMatches', label: 'New Matches', icon: Heart, desc: 'When you get a new match' },
            { key: 'newMessages', label: 'New Messages', icon: MessageCircle, desc: 'When you receive a message' },
            { key: 'likesReceived', label: 'Likes Received', icon: Heart, desc: 'When someone likes you' },
            { key: 'profileViews', label: 'Profile Views', icon: Eye, desc: 'When someone views your profile' },
            { key: 'superLikes', label: 'Super Likes', icon: Heart, desc: 'When someone super likes you' },
            { key: 'matchActivity', label: 'Match Activity', icon: Bell, desc: 'When your matches are online' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 glass rounded-xl">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-primary-blue" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
              </div>
              <button
                onClick={() => updateSetting(item.key, !settings[item.key as keyof typeof settings])}
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings[item.key as keyof typeof settings] ? 'gradient-blue' : 'bg-gray-600'
                }`}
              >
                <motion.div
                  className="w-6 h-6 bg-white rounded-full shadow-lg"
                  animate={{ x: settings[item.key as keyof typeof settings] ? 28 : 2, y: 0.5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quiet Hours</h2>
          
          <div className="glass rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Enable Quiet Hours</div>
                <div className="text-xs text-gray-400">Don't receive notifications during these times</div>
              </div>
              <button
                onClick={() => updateSetting('quietHours', !settings.quietHours)}
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings.quietHours ? 'gradient-turquoise' : 'bg-gray-600'
                }`}
              >
                <motion.div
                  className="w-6 h-6 bg-white rounded-full shadow-lg"
                  animate={{ x: settings.quietHours ? 28 : 2, y: 0.5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {settings.quietHours && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="time"
                    value={settings.quietStart}
                    onChange={(e) => updateSetting('quietStart', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-turquoise"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="time"
                    value={settings.quietEnd}
                    onChange={(e) => updateSetting('quietEnd', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-turquoise"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Notification Frequency */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Notification Frequency</h2>
          
          <div className="space-y-2">
            {[
              { value: 'realtime', label: 'Real-time', desc: 'Get notifications immediately' },
              { value: 'hourly', label: 'Hourly Digest', desc: 'Get notifications once per hour' },
              { value: 'daily', label: 'Daily Digest', desc: 'Get notifications once per day' }
            ].map((freq) => (
              <button
                key={freq.value}
                onClick={() => updateSetting('frequency', freq.value)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  settings.frequency === freq.value
                    ? 'border-primary-blue bg-primary-blue/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{freq.label}</div>
                    <div className="text-sm text-gray-400">{freq.desc}</div>
                  </div>
                  {settings.frequency === freq.value && (
                    <Check className="w-5 h-5 text-primary-blue" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sound & Vibration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Sound & Vibration</h2>
          
          <div className="glass rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Sound</div>
                <div className="text-xs text-gray-400">Play sound for notifications</div>
              </div>
              <button
                onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings.soundEnabled ? 'gradient-red' : 'bg-gray-600'
                }`}
              >
                <motion.div
                  className="w-6 h-6 bg-white rounded-full shadow-lg"
                  animate={{ x: settings.soundEnabled ? 28 : 2, y: 0.5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Vibration</div>
                <div className="text-xs text-gray-400">Vibrate on notifications</div>
              </div>
              <button
                onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)}
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings.vibrationEnabled ? 'gradient-red' : 'bg-gray-600'
                }`}
              >
                <motion.div
                  className="w-6 h-6 bg-white rounded-full shadow-lg"
                  animate={{ x: settings.vibrationEnabled ? 28 : 2, y: 0.5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Badge Counts */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Badge Counts</div>
              <div className="text-xs text-gray-400">Show notification count on app icon</div>
            </div>
            <button
              onClick={() => updateSetting('badgeCounts', !settings.badgeCounts)}
              className={`w-14 h-7 rounded-full transition-colors ${
                settings.badgeCounts ? 'gradient-turquoise' : 'bg-gray-600'
              }`}
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full shadow-lg"
                animate={{ x: settings.badgeCounts ? 28 : 2, y: 0.5 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pb-4">
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-primary-turquoise text-sm font-medium mb-3"
            >
              ✓ Settings saved!
            </motion.div>
          )}
          
          <motion.button
            onClick={saveSettings}
            disabled={saving}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-4 rounded-2xl font-bold text-white gradient-red disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
