'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { MapPin, Briefcase, GraduationCap, Heart, X, Star } from 'lucide-react'
import { getMediaUrl } from '@/lib/supabase'
import dynamic from 'next/dynamic'

// Lazy load PromptsDisplay
const PromptsDisplay = dynamic(() => import('./PromptsDisplay'), {
  ssr: false,
})

interface Profile {
  id: string
  name: string
  birthday: string
  bio: string | null
  gender: string | null
  interests: string[]
  city: string | null
  distance?: number
  compatibility?: number
  verified?: boolean
  last_active?: string
  media: Array<{
    media_type: 'photo' | 'video'
    storage_path: string
  }>
}

interface ProfileCardProps {
  profile: Profile
  onLike: () => void
  onPass: () => void
  onSuperLike: () => void
  isTop: boolean
}

export default function ProfileCard({ 
  profile, 
  onLike, 
  onPass, 
  onSuperLike,
  isTop 
}: ProfileCardProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

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

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return `${Math.floor(diffInSeconds / 604800)}w ago`
  }

  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.x > 100) {
      // Track photo view before like
      const { trackPhotoView } = await import('@/lib/photoEngagement')
      const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser())
      if (user && profile.id) {
        trackPhotoView(profile.id, currentMediaIndex, user.id)
      }
      onLike()
    } else if (info.offset.x < -100) {
      onPass()
    }
  }

  const handleDoubleTap = () => {
    onSuperLike()
  }

  const currentMedia = profile.media && profile.media.length > 0 ? profile.media[currentMediaIndex] : null
  
  // Get media URL - handle both Supabase storage paths and direct URLs
  const getMediaUrlSafe = useCallback((path: string) => {
    if (!path) {
      return '/placeholder.jpg'
    }
    
    // If it's already a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    
    // Otherwise, get from Supabase storage
    try {
      return getMediaUrl(path)
    } catch (error) {
      return '/placeholder.jpg'
    }
  }, [])
  
  const mediaUrl = useMemo(() => {
    return currentMedia ? getMediaUrlSafe(currentMedia.storage_path) : '/placeholder.jpg'
  }, [currentMedia, getMediaUrlSafe])
  

  return (
    <motion.div
      className="profile-card touch-manipulation"
      style={{ x, rotate, opacity, zIndex: isTop ? 10 : 1 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      onDoubleClick={handleDoubleTap}
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* Media */}
      <div className="relative w-full h-full bg-dark-card">
        {profile.media && profile.media.length > 0 ? (
          currentMedia?.media_type === 'video' ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.jpg'
                }}
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-red/20 via-primary-blue/20 to-primary-turquoise/20">
            <div className="text-center">
              <Heart className="w-16 h-16 text-primary-red mx-auto mb-4 opacity-50" />
              <p className="text-white/50">No photos</p>
            </div>
          </div>
        )}

        {/* Media indicators - Enhanced visibility */}
        {profile.media && profile.media.length > 1 && (
          <div className="absolute top-4 left-0 right-0 flex items-center justify-center gap-2 px-4 z-30 pointer-events-none">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl">
              {profile.media.map((_, index) => (
                <motion.div
                  key={index}
                  className={`rounded-full transition-all ${
                    index === currentMediaIndex
                      ? 'w-3.5 h-3.5 bg-white shadow-lg shadow-white/70 border-2 border-white ring-2 ring-white/50'
                      : 'w-3 h-3 bg-white/80 backdrop-blur-sm border-2 border-white/60'
                  }`}
                  initial={false}
                  animate={{
                    scale: index === currentMediaIndex ? 1.3 : 1,
                    opacity: index === currentMediaIndex ? 1 : 0.7
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tap zones for navigation */}
        {profile.media && profile.media.length > 1 && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-1/3 z-20"
              onClick={(e) => {
                e.stopPropagation()
                setCurrentMediaIndex(Math.max(0, currentMediaIndex - 1))
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-1/3 z-20"
              onClick={(e) => {
                e.stopPropagation()
                setCurrentMediaIndex(
                  Math.min(profile.media.length - 1, currentMediaIndex + 1)
                )
              }}
            />
          </>
        )}

        {/* Gradient overlay - only show when details panel is closed */}
        {!showDetails && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-20" />
        )}

        {/* Content - hide when details panel is open */}
        {!showDetails && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-6 text-white z-30"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
          >
          {/* Basic info */}
          <div className="mb-3">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                {profile.name}
              </h2>
              {profile.verified && (
                <motion.div
                  className="w-5 h-5 rounded-full bg-primary-turquoise flex items-center justify-center shadow-lg shadow-primary-turquoise/50"
                  title="Verified Profile"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <span className="text-[10px] text-white font-bold">✓</span>
                </motion.div>
              )}
              <span className="text-xl font-semibold text-white/90">{calculateAge(profile.birthday)}</span>
            </div>

            {profile.city && (
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {profile.city}
                  {profile.distance !== undefined && (
                    <span className="ml-1.5 text-primary-turquoise font-semibold">
                      • {Math.round(profile.distance)}km
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Compatibility Score */}
            {profile.compatibility !== undefined && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <Heart className="w-3 h-3 text-primary-red" />
                  <span className="text-xs font-semibold text-white">
                    {Math.round(profile.compatibility)}%
                  </span>
                </div>
                {profile.last_active && (
                  <span className="text-xs text-neutral-400">
                    {getTimeAgo(profile.last_active)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Interests */}
          {profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.interests.slice(0, 3).map((interest, i) => (
                <motion.span
                  key={i}
                  className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium border border-white/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {interest}
                </motion.span>
              ))}
              {profile.interests.length > 3 && (
                <motion.span
                  className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium border border-white/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 20 }}
                >
                  +{profile.interests.length - 3}
                </motion.span>
              )}
            </div>
          )}

          {/* Bio preview */}
          {profile.bio && (
            <p className="text-sm text-neutral-300 leading-relaxed line-clamp-2 mb-3">
              {profile.bio}
            </p>
          )}

          {/* Action Row */}
          <div className="flex gap-3 relative z-40">
            <motion.button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowDetails(!showDetails)
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowDetails(!showDetails)
              }}
              className="flex-1 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium hover:bg-white/20 transition-all border border-white/20 cursor-pointer touch-manipulation z-40"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showDetails ? 'Show less' : 'See more'}
            </motion.button>
            
          </div>
        </motion.div>
        )}

        {/* Detailed info panel */}
        <AnimatePresence>
          {showDetails && (
            <>
              {/* Backdrop to catch clicks outside */}
              <motion.div
                className="absolute inset-0 bg-black/50 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDetails(false)
                }}
              />
              
              <motion.div
                className="absolute bottom-0 left-0 right-0 glass-strong rounded-t-3xl p-6 max-h-[60vh] overflow-y-auto z-50"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDetails(false)
                }}
                onTouchStart={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDetails(false)
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-50 cursor-pointer touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <h3 className="text-2xl font-bold mb-3">About {profile.name}</h3>
                <p className="text-gray-200 leading-relaxed">{profile.bio || 'No bio yet'}</p>
              </div>

              {profile.interests.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-3 text-lg">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 bg-white/10 rounded-full text-sm border border-white/10"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.city && (
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.city}</span>
                </div>
              )}

              {/* Prompts */}
              <PromptsDisplay userId={profile.id} />
              
              {/* Close button at bottom */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDetails(false)
                }}
                onTouchStart={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDetails(false)
                }}
                className="mt-4 w-full px-4 py-3 bg-white/10 rounded-full text-sm font-medium hover:bg-white/20 transition-all border border-white/20 cursor-pointer touch-manipulation"
              >
                Close
              </button>
            </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Swipe indicators */}
        <motion.div
          className="absolute top-1/4 left-8 rotate-12"
          style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
        >
          <div className="px-6 py-3 border-4 border-green-500 rounded-2xl">
            <span className="text-4xl font-bold text-green-500">LIKE</span>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-1/4 right-8 -rotate-12"
          style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
        >
          <div className="px-6 py-3 border-4 border-red-500 rounded-2xl">
            <span className="text-4xl font-bold text-red-500">NOPE</span>
          </div>
        </motion.div>
      </div>

      {/* Action buttons removed - use swipe gestures instead */}

    </motion.div>
  )
}

