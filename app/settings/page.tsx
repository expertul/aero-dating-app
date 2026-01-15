'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { motion } from 'framer-motion'
import { ArrowLeft, Bell, Shield, Users, MapPin, Heart, HelpCircle, ChevronRight, Palette } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<any>(null)
  const [originalPreferences, setOriginalPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const prefs = data || {
        age_min: 18,
        age_max: 99,
        distance_km: 50,
        gender_preferences: [],
        show_me: true
      }
      setPreferences(prefs)
      setOriginalPreferences(prefs)
    } catch (error) {
      // Error loading preferences
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = (updates: any) => {
    const newPrefs = { ...preferences, ...updates }
    setPreferences(newPrefs)
    setHasChanges(true)
    setSaved(false)
  }

  const toggleGenderPreference = (gender: string) => {
    const current = preferences.gender_preferences || []
    const updated = current.includes(gender)
      ? current.filter((g: string) => g !== gender)
      : [...current, gender]
    updatePreference({ gender_preferences: updated })
  }

  const saveChanges = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('preferences')
        .upsert({
          user_id: user.id,
          ...preferences
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setOriginalPreferences(preferences)
      setHasChanges(false)
      setSaved(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      // Error saving preferences
      alert('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const cancelChanges = () => {
    setPreferences(originalPreferences)
    setHasChanges(false)
    setSaved(false)
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
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {/* Discovery Preferences */}
        <div className="glass rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Heart className="w-3.5 h-3.5 text-primary-red" />
            <h2 className="text-sm font-semibold">Discovery Preferences</h2>
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-[10px] font-medium mb-1">
              Age: {preferences.age_min} - {preferences.age_max}
            </label>
            <div className="space-y-0.5">
              <input
                type="range"
                min="18"
                max="99"
                value={preferences.age_min}
                onChange={(e) => updatePreference({ age_min: parseInt(e.target.value) })}
                className="w-full h-1"
              />
              <input
                type="range"
                min="18"
                max="99"
                value={preferences.age_max}
                onChange={(e) => updatePreference({ age_max: parseInt(e.target.value) })}
                className="w-full h-1"
              />
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-[10px] font-medium mb-1">
              <MapPin className="inline w-2.5 h-2.5 mr-0.5" />
              Distance: {preferences.distance_km}km
            </label>
            <input
              type="range"
              min="1"
              max="200"
              value={preferences.distance_km}
              onChange={(e) => updatePreference({ distance_km: parseInt(e.target.value) })}
              className="w-full h-1"
            />
          </div>

          {/* Gender Preferences */}
          <div>
            <label className="block text-[10px] font-medium mb-1">
              <Users className="inline w-2.5 h-2.5 mr-0.5" />
              Show Me
            </label>
            <div className="grid grid-cols-3 gap-1">
              {['man', 'woman', 'non-binary'].map((gender) => {
                const isSelected = preferences.gender_preferences?.includes(gender)
                return (
                  <button
                    key={gender}
                    onClick={() => toggleGenderPreference(gender)}
                    className={`px-1.5 py-1 rounded-lg border transition-all text-[10px] ${
                      isSelected
                        ? 'border-primary-blue bg-primary-blue/20'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {preferences.gender_preferences?.length === 0 
                ? '⚠️ Select one' 
                : `${preferences.gender_preferences?.length || 0} selected`}
            </p>
          </div>

          {/* Show Me */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium">Make profile visible</span>
            <button
              onClick={() => updatePreference({ show_me: !preferences.show_me })}
              className={`w-12 h-6 rounded-full transition-colors ${
                preferences.show_me ? 'gradient-turquoise' : 'bg-gray-600'
              }`}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full shadow-lg"
                animate={{ x: preferences.show_me ? 24 : 2, y: 0.5 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-2 space-y-2">
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-primary-turquoise text-xs font-medium"
              >
                ✓ Saved!
              </motion.div>
            )}
            
            <div className="flex gap-2">
              <motion.button
                onClick={saveChanges}
                disabled={!hasChanges || saving}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white ${
                  hasChanges ? 'gradient-red' : 'bg-gray-600 cursor-not-allowed'
                }`}
                whileTap={hasChanges ? { scale: 0.98 } : {}}
              >
                {saving ? 'Saving...' : 'Save'}
              </motion.button>

              {hasChanges && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={cancelChanges}
                  className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
                >
                  Cancel
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Other Settings */}
        <div className="glass rounded-xl overflow-hidden">
          <button
            onClick={() => router.push('/settings/appearance')}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/10"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary-red" />
              <span className="text-sm">Appearance & Display</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => router.push('/settings/notifications')}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/10"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-blue" />
              <span className="text-sm">Notifications</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => router.push('/settings/privacy')}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/10"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-turquoise" />
              <span className="text-sm">Privacy & Safety</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => router.push('/settings/help')}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Help & Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* App Info */}
        <div className="text-center text-xs text-gray-500 pb-3">
          <p>AERO Dating v1.0.0</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

