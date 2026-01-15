'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getMediaUrl } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { motion } from 'framer-motion'
import { Edit, MapPin, Calendar, Heart, LogOut, Camera } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profileStrength, setProfileStrength] = useState(0)
  const [profileViews, setProfileViews] = useState(0)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          media:profile_media(*)
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        // Profile might not exist yet
        if (error.code === 'PGRST116') {
          // No profile found - redirect to onboarding
          router.push('/onboarding')
          return
        }
      }

      setProfile(data)

      // Calculate profile strength and get views
      if (data) {
        const { calculateProfileStrength, getProfileViewsCount } = await import('@/lib/profileUtils')
        const strength = await calculateProfileStrength(user.id)
        const views = await getProfileViewsCount(user.id)
        setProfileStrength(strength)
        setProfileViews(views)
      }
    } catch (error) {
      // Error loading profile
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const calculateAge = (birthday: string) => {
    const today = new Date()
    const birthDate = new Date(birthday)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="h-screen bg-dark-bg text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="safe-top px-4 py-3 flex justify-between items-center border-b border-dark-border flex-shrink-0">
        <h1 className="text-2xl font-bold">Profile</h1>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors text-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      <div className="flex-1 overflow-hidden px-3 py-2">
        <div className="h-full flex flex-col space-y-1.5">
          {/* Photos Grid - Very Small */}
          {profile.media && profile.media.length > 0 ? (
            <div className="grid grid-cols-7 gap-0.5">
              {profile.media.map((media: any, index: number) => (
                <motion.div
                  key={media.id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="aspect-square rounded overflow-hidden bg-dark-card"
                >
                  <img
                    src={getMediaUrl(media.storage_path)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%231C2128" width="200" height="200"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="20"%3ENo Photo%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-16 rounded bg-dark-card flex items-center justify-center border border-dashed border-white/10">
              <div className="text-center">
                <Camera className="w-4 h-4 text-gray-400 mx-auto mb-0.5" />
                <p className="text-gray-400 text-xs">No photos</p>
              </div>
            </div>
          )}

          {/* Basic Info - Compact */}
          <div className="glass rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-base font-bold">{profile.name}</h2>
                <p className="text-gray-400 text-xs">{calculateAge(profile.birthday)} years old</p>
              </div>
              <button
                onClick={() => router.push('/profile/edit')}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {profile.city && (
                <div className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{profile.city}</span>
                </div>
              )}
              {profile.birthday && (
                <div className="flex items-center gap-0.5">
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{new Date(profile.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio - Compact */}
          {profile.bio && (
            <div className="glass rounded-lg p-2.5">
              <h3 className="font-semibold mb-1 text-xs">About Me</h3>
              <p className="text-gray-300 text-xs leading-tight line-clamp-2">{profile.bio}</p>
            </div>
          )}

          {/* Interests - Compact */}
          {profile.interests?.length > 0 && (
            <div className="glass rounded-lg p-2.5">
              <h3 className="font-semibold mb-1 text-xs">Interests</h3>
              <div className="flex flex-wrap gap-1">
                {profile.interests.slice(0, 8).map((interest: string, i: number) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 bg-primary-turquoise/20 border border-primary-turquoise/30 rounded-full text-xs"
                  >
                    {interest}
                  </span>
                ))}
                {profile.interests.length > 8 && (
                  <span className="px-1.5 py-0.5 text-gray-400 text-xs">+{profile.interests.length - 8}</span>
                )}
              </div>
            </div>
          )}

          {/* Stats - Compact */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className="glass rounded-lg p-2 text-center">
              <Heart className="w-3 h-3 mx-auto mb-0.5 text-primary-red" />
              <p className="text-base font-bold">{profile.media?.length || 0}</p>
              <p className="text-xs text-gray-400">Photos</p>
            </div>
            <div className="glass rounded-lg p-2 text-center">
              <div className="w-3 h-3 mx-auto mb-0.5 gradient-turquoise rounded-full" />
              <p className="text-base font-bold">
                {profile.verified ? 'Yes' : 'No'}
              </p>
              <p className="text-xs text-gray-400">Verified</p>
            </div>
            <div className="glass rounded-lg p-2 text-center">
              <div className="w-3 h-3 mx-auto mb-0.5 gradient-blue rounded-full" />
              <p className="text-base font-bold">
                {profile.interests?.length || 0}
              </p>
              <p className="text-xs text-gray-400">Interests</p>
            </div>
            <div className="glass rounded-lg p-2 text-center">
              <div className="w-3 h-3 mx-auto mb-0.5 gradient-red rounded-full" />
              <p className="text-base font-bold">{profileViews}</p>
              <p className="text-xs text-gray-400">Views</p>
            </div>
          </div>

          {/* Profile Strength */}
          <div className="glass rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-xs">Profile Strength</h3>
              <span className="text-xs font-bold">{profileStrength}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileStrength}%` }}
                transition={{ duration: 0.5 }}
                className="h-full gradient-blue rounded-full"
              />
            </div>
            {profileStrength < 80 && (
              <p className="text-[10px] text-gray-400 mt-1">
                Add more photos and complete your bio to improve your profile
              </p>
            )}
          </div>

          {/* Action Buttons - Compact */}
          <div className="space-y-1.5 mt-auto">
            <button
              onClick={() => router.push('/profile/edit')}
              className="w-full px-3 py-2 rounded-lg gradient-blue text-white text-xs font-semibold"
            >
              Edit Profile
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="w-full px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-xs"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

