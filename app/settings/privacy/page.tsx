'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Eye, EyeOff, MapPin, Lock, Download, Trash2, Check } from 'lucide-react'

export default function PrivacyPage() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    profileVisibility: 'everyone' as 'everyone' | 'matches' | 'incognito',
    readReceipts: true,
    typingIndicators: true,
    lastSeen: true,
    locationSharing: 'approximate' as 'precise' | 'approximate' | 'none',
    photoPrivacy: 'everyone' as 'everyone' | 'matches' | 'none'
  })
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
    loadBlockedUsers()
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
        .select('privacy_settings')
        .eq('user_id', user.id)
        .single()

      if (data?.privacy_settings) {
        setSettings({ ...settings, ...data.privacy_settings })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBlockedUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('blocks')
        .select(`
          id,
          blocked_id,
          created_at,
          profiles!blocks_blocked_id_fkey(id, name, media:profile_media(storage_path))
        `)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false })

      setBlockedUsers(data || [])
    } catch (error) {
      console.error('Error loading blocked users:', error)
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
          privacy_settings: settings
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

  const unblockUser = async (blockId: string) => {
    try {
      await supabase
        .from('blocks')
        .delete()
        .eq('id', blockId)
      
      loadBlockedUsers()
    } catch (error) {
      console.error('Error unblocking user:', error)
    }
  }

  const exportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all user data
      const [profile, messages, matches, likes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('messages').select('*').or(`sender_id.eq.${user.id},match_id.in.(select id from matches where user_a.eq.${user.id} or user_b.eq.${user.id})`),
        supabase.from('matches').select('*').or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
        supabase.from('likes').select('*').or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
      ])

      const data = {
        profile: profile.data,
        messages: messages.data,
        matches: matches.data,
        likes: likes.data,
        exportedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aero-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data')
    }
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
        <h1 className="text-2xl font-bold">Privacy & Safety</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Profile Visibility */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Profile Visibility</h2>
          
          <div className="space-y-2">
            {[
              { value: 'everyone', label: 'Everyone', desc: 'Your profile is visible to all users' },
              { value: 'matches', label: 'Matches Only', desc: 'Only your matches can see your profile' },
              { value: 'incognito', label: 'Incognito Mode', desc: 'Browse without being seen' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateSetting('profileVisibility', option.value)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  settings.profileVisibility === option.value
                    ? 'border-primary-turquoise bg-primary-turquoise/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-gray-400">{option.desc}</div>
                  </div>
                  {settings.profileVisibility === option.value && (
                    <Check className="w-5 h-5 text-primary-turquoise" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Privacy */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Chat Privacy</h2>
          
          <div className="glass rounded-xl p-4 space-y-4">
            {[
              { key: 'readReceipts', label: 'Read Receipts', desc: 'Show when messages are read' },
              { key: 'typingIndicators', label: 'Typing Indicators', desc: 'Show when someone is typing' },
              { key: 'lastSeen', label: 'Last Seen', desc: 'Show when you were last active' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
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
        </div>

        {/* Location Privacy */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Location Privacy</h2>
          
          <div className="space-y-2">
            {[
              { value: 'precise', label: 'Precise', desc: 'Show exact location' },
              { value: 'approximate', label: 'Approximate', desc: 'Show general area (recommended)' },
              { value: 'none', label: 'Hidden', desc: 'Don\'t show location' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateSetting('locationSharing', option.value)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  settings.locationSharing === option.value
                    ? 'border-primary-blue bg-primary-blue/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-gray-400">{option.desc}</div>
                  </div>
                  {settings.locationSharing === option.value && (
                    <Check className="w-5 h-5 text-primary-blue" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Photo Privacy */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Photo Privacy</h2>
          
          <div className="space-y-2">
            {[
              { value: 'everyone', label: 'Everyone', desc: 'All users can see your photos' },
              { value: 'matches', label: 'Matches Only', desc: 'Only matches can see your photos' },
              { value: 'none', label: 'Hidden', desc: 'Photos are hidden until matched' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateSetting('photoPrivacy', option.value)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  settings.photoPrivacy === option.value
                    ? 'border-primary-red bg-primary-red/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-gray-400">{option.desc}</div>
                  </div>
                  {settings.photoPrivacy === option.value && (
                    <Check className="w-5 h-5 text-primary-red" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Blocked Users */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Blocked Users</h2>
          
          {blockedUsers.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center text-gray-400">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No blocked users</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((block: any) => (
                <div key={block.id} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {block.profiles?.media?.[0]?.storage_path ? (
                      <img
                        src={`https://your-supabase-url.supabase.co/storage/v1/object/public/profile-media/${block.profiles.media[0].storage_path}`}
                        alt={block.profiles.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <EyeOff className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{block.profiles?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">Blocked</div>
                    </div>
                  </div>
                  <button
                    onClick={() => unblockUser(block.id)}
                    className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Data Management</h2>
          
          <div className="space-y-3">
            <motion.button
              onClick={exportData}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 glass rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-primary-turquoise" />
                <div className="text-left">
                  <div className="font-medium">Export Data</div>
                  <div className="text-xs text-gray-400">Download your data</div>
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => {
                if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                  // Handle account deletion
                  alert('Account deletion feature coming soon')
                }
              }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 glass rounded-xl flex items-center gap-3 hover:bg-red-500/10 transition-colors border border-red-500/20"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <div className="font-medium text-red-500">Delete Account</div>
                <div className="text-xs text-gray-400">Permanently delete your account</div>
              </div>
            </motion.button>
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
