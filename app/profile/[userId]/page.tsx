'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, getMediaUrl } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Calendar, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ViewProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.userId as string
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      setCurrentUserId(user.id)

      // If viewing own profile, redirect to main profile page
      if (user.id === userId) {
        router.push('/profile')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          media:profile_media(*)
        `)
        .eq('id', userId)
        .single()

      if (error) {
        // Error loading profile
        if (error.code === 'PGRST116') {
          // Profile not found
          router.back()
          return
        }
      }

      setProfile(data)

      // Track profile view
      if (data && user.id !== userId) {
        const { trackProfileView } = await import('@/lib/profileUtils')
        trackProfileView(userId, user.id)
      }
    } catch (error) {
      // Error loading profile
    } finally {
      setLoading(false)
    }
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

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg text-white">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Profile not found</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-primary-red text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-dark-bg text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="safe-top px-3 py-2 flex items-center gap-2 border-b border-dark-border flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="p-1.5 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold">{profile.name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {/* Photos Grid */}
        {profile.media && profile.media.length > 0 ? (
          <div className="grid grid-cols-7 gap-1">
            {profile.media.map((media: any, index: number) => (
              <motion.div
                key={media.id || index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="aspect-square rounded-lg overflow-hidden bg-dark-card cursor-pointer"
                onClick={() => setSelectedPhotoIndex(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
          <div className="aspect-square rounded-lg bg-dark-card flex items-center justify-center border border-dashed border-white/10">
            <div className="text-center">
              <p className="text-gray-400 text-sm">No photos</p>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="glass rounded-lg p-2.5">
          <div className="mb-1">
            <h2 className="text-base font-bold">{profile.name}</h2>
            <p className="text-gray-400 text-[10px]">{calculateAge(profile.birthday)} years old</p>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-gray-400">
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

        {/* Bio */}
        {profile.bio && (
          <div className="glass rounded-lg p-2.5">
            <h3 className="font-semibold mb-1 text-xs">About Me</h3>
            <p className="text-gray-300 text-[10px] leading-tight line-clamp-3">{profile.bio}</p>
          </div>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <div className="glass rounded-lg p-2.5">
            <h3 className="font-semibold mb-1 text-xs">Interests</h3>
            <div className="flex flex-wrap gap-1">
              {profile.interests.slice(0, 6).map((interest: string, i: number) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-primary-turquoise/20 border border-primary-turquoise/30 rounded-full text-[10px]"
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 6 && (
                <span className="px-1.5 py-0.5 text-gray-400 text-[10px]">+{profile.interests.length - 6}</span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="glass rounded-lg p-2 text-center">
            <Heart className="w-3 h-3 mx-auto mb-0.5 text-primary-red" />
            <p className="text-sm font-bold">{profile.media?.length || 0}</p>
            <p className="text-[10px] text-gray-400">Photos</p>
          </div>
          <div className="glass rounded-lg p-2 text-center">
            <div className="w-3 h-3 mx-auto mb-0.5 gradient-turquoise rounded-full" />
            <p className="text-sm font-bold">
              {profile.verified ? 'Yes' : 'No'}
            </p>
            <p className="text-[10px] text-gray-400">Verified</p>
          </div>
          <div className="glass rounded-lg p-2 text-center">
            <div className="w-3 h-3 mx-auto mb-0.5 gradient-blue rounded-full" />
            <p className="text-sm font-bold">
              {profile.interests?.length || 0}
            </p>
            <p className="text-[10px] text-gray-400">Interests</p>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && profile.media && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Previous Button */}
            {selectedPhotoIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPhotoIndex(selectedPhotoIndex - 1)
                }}
                className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}

            {/* Next Button */}
            {selectedPhotoIndex < profile.media.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPhotoIndex(selectedPhotoIndex + 1)
                }}
                className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}

            {/* Photo */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-[90vh] w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getMediaUrl(profile.media[selectedPhotoIndex].storage_path)}
                alt={`Photo ${selectedPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.jpg'
                }}
              />
            </motion.div>

            {/* Photo Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
              <span className="text-white text-sm">
                {selectedPhotoIndex + 1} / {profile.media.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}

