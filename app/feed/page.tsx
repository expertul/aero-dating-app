'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, getMediaUrl } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import dynamic from 'next/dynamic'
import { Sparkles, RefreshCw, Zap, RotateCcw, Star } from 'lucide-react'

// Lazy load heavy components
const ProfileCard = dynamic(() => import('@/components/ProfileCard'), {
  loading: () => <div className="flex items-center justify-center h-full"><div className="spinner"></div></div>,
  ssr: false,
})
const MatchModal = dynamic(() => import('@/components/MatchModal'), {
  ssr: false,
})
const BottomNav = dynamic(() => import('@/components/BottomNav'), {
  ssr: false,
})
const DiscoveryModes = dynamic(() => import('@/components/DiscoveryModes'), {
  ssr: false,
})

export default function FeedPage() {
  const router = useRouter()
  const { feedProfiles, setFeedProfiles, removeCurrentProfile, setShowMatchModal, showMatchModal } = useStore()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isBoosted, setIsBoosted] = useState(false)
  const [lastSwipedProfile, setLastSwipedProfile] = useState<any>(null)
  const [lastSwipeAction, setLastSwipeAction] = useState<'like' | 'pass' | 'superlike' | null>(null)
  const [topPicks, setTopPicks] = useState<any[]>([])
  const [showTopPicks, setShowTopPicks] = useState(false)
  const [discoveryMode, setDiscoveryMode] = useState<'classic' | 'explore' | 'speed' | 'events' | 'groups' | 'incognito'>('classic')

  useEffect(() => {
    checkAuth()
    
    // Load top picks
    if (userId) {
      loadTopPicks(userId)
    }
    
    // Subscribe to new matches in real-time
    if (userId) {
      const channelName = `feed-matches-${userId}-${Date.now()}`
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matches',
            filter: `user_a=eq.${userId}`
          },
          () => {
            // Optionally refresh feed or show notification
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matches',
            filter: `user_b=eq.${userId}`
          },
          () => {
            // Optionally refresh feed or show notification
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [userId])

  const loadTopPicks = useCallback(async (currentUserId: string) => {
    try {
      const { getTopPicks } = await import('@/lib/topPicks')
      const picks = await getTopPicks(currentUserId)
      setTopPicks(picks || [])
    } catch (error) {
      // Error loading top picks
    }
  }, [])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }
    setUserId(session.user.id)
    loadFeed(session.user.id)
  }

  const loadFeed = async (currentUserId: string) => {
    setLoading(true)
    try {
      // Check for active boost
      const { data: activeBoost } = await supabase
        .from('boosts')
        .select('*')
        .eq('user_id', currentUserId)
        .gt('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setIsBoosted(!!activeBoost)

      // Get user preferences
      const { data: prefs } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', currentUserId)
        .single()

      // Try smart feed algorithm first (learns from swipe patterns)
      try {
        const { getSmartFeedProfiles } = await import('@/lib/smartFeedAlgorithm')
        const smartProfiles = await getSmartFeedProfiles(currentUserId, 20)
        
        if (smartProfiles && smartProfiles.length > 0) {
          // Get bots separately
          const { getBotsForFeed } = await import('@/lib/botService')
          const bots = await getBotsForFeed(currentUserId, 5) || []
          
          // Combine smart profiles with bots (bots first for testing)
          const allProfiles = [...bots, ...smartProfiles]
          
          // Calculate distances if available
          const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('latitude, longitude')
            .eq('id', currentUserId)
            .single()
          
          if (currentUserProfile?.latitude && currentUserProfile?.longitude) {
            const profilesWithDistance = allProfiles.map(profile => {
              let distance: number | undefined
              if (profile.latitude && profile.longitude) {
                distance = calculateDistance(
                  currentUserProfile.latitude,
                  currentUserProfile.longitude,
                  profile.latitude,
                  profile.longitude
                )
              }
              return { ...profile, distance }
            })
            
            setFeedProfiles(profilesWithDistance)
            setLoading(false)
            return
          } else {
            setFeedProfiles(allProfiles)
            setLoading(false)
            return
          }
        }
      } catch (error) {
        console.error('[Feed] Smart algorithm error, falling back to regular feed:', error)
        // Fall through to regular feed loading
      }

      // Get profiles user has already swiped on
      const { data: swipedIds } = await supabase
        .from('likes')
        .select('to_user')
        .eq('from_user', currentUserId)

      const excludeIds = [currentUserId, ...(swipedIds?.map(s => s.to_user) || [])]

      // Get blocked users
      const { data: blocked } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', currentUserId)

      if (blocked) {
        excludeIds.push(...blocked.map(b => b.blocked_id))
      }

      // Get boosted profiles (if user is boosted, prioritize them)
      let boostedProfileIds: string[] = []
      if (activeBoost) {
        const { data: boostedProfiles } = await supabase
          .from('boosts')
          .select('user_id')
          .gt('ends_at', new Date().toISOString())
          .neq('user_id', currentUserId)
        
        boostedProfileIds = boostedProfiles?.map(b => b.user_id) || []
      }

      // Get user's location for distance calculation
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', currentUserId)
        .single()

      // Filter by gender preferences if set
      // Exclude bots from main query (they'll be added separately)
      let query = supabase
        .from('profiles')
        .select(`
          *,
          media:profile_media(*)
        `)
        .neq('id', currentUserId)
      
      // Only add exclude filter if there are IDs to exclude
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`)
      }
      
      // Exclude bots from main query (they'll be added separately)
      // Use a filter that excludes bots (is_bot is null or false)
      query = query.or('is_bot.is.null,is_bot.eq.false')

      // Apply gender filter if preferences exist
      if (prefs?.gender_preferences && prefs.gender_preferences.length > 0) {
        query = query.in('gender', prefs.gender_preferences)
      }

      // Apply age filter
      if (prefs?.age_min || prefs?.age_max) {
        // Calculate birth year range
        const today = new Date()
        const maxBirthYear = prefs.age_max ? today.getFullYear() - prefs.age_max : null
        const minBirthYear = prefs.age_min ? today.getFullYear() - prefs.age_min : null
        
        // Note: This is a simplified age filter. For production, use proper date calculations
      }

      const { data: profilesData, error } = await query.limit(50)

      if (error) {
        throw error
      }

      // Get bots for feed (always show bots for testing)
      const { getBotsForFeed } = await import('@/lib/botService')
      let bots: any[] = []
      try {
        bots = await getBotsForFeed(currentUserId, 5) || [] // Get all available bots
      } catch (botError) {
        // Error fetching bots - continue without them
      }
      
      // Start with regular profiles
      let profiles = profilesData || []
      
      // Add bots to profiles array (prioritize them at the beginning)
      if (bots && bots.length > 0) {
        // Add bots at the start of the feed for easy testing
        profiles = [...bots, ...profiles]
      }

      // Calculate distances and compatibility scores
      if (currentUserProfile?.latitude && currentUserProfile?.longitude) {
        const profilesWithDistance = profiles?.map(profile => {
          let distance: number | undefined
          if (profile.latitude && profile.longitude) {
            distance = calculateDistance(
              currentUserProfile.latitude,
              currentUserProfile.longitude,
              profile.latitude,
              profile.longitude
            )
          }
          
          // Calculate compatibility score
          const compatibility = calculateCompatibility(currentUserProfile, profile, prefs)
          
          return { ...profile, distance, compatibility }
        }) || []

        // Filter by distance preference (but always include bots)
        let filtered = profilesWithDistance.filter(p => {
          // Always include bots regardless of distance or any other filter
          if (p.is_bot) return true
          // For regular users, apply distance filter
          return !p.distance || !prefs?.distance_km || p.distance <= prefs.distance_km
        })

        // Sort: Bots first, then by boost status, then compatibility score
        filtered.sort((a, b) => {
          // Bots always first
          if (a.is_bot && !b.is_bot) return -1
          if (!a.is_bot && b.is_bot) return 1
          // Then boosted profiles
          const aBoosted = boostedProfileIds.includes(a.id)
          const bBoosted = boostedProfileIds.includes(b.id)
          if (aBoosted && !bBoosted) return -1
          if (!aBoosted && bBoosted) return 1
          // Then by compatibility
          return (b.compatibility || 0) - (a.compatibility || 0)
        })

        // Always show bots first, then other profiles
        const botProfiles = filtered.filter(p => p.is_bot)
        const regularProfiles = filtered.filter(p => !p.is_bot)
        const finalProfiles = [...botProfiles, ...regularProfiles].slice(0, 20)
        
        setFeedProfiles(finalProfiles)
      } else {
        // Still calculate compatibility even without distance
        const profilesWithCompatibility = profiles?.map(profile => {
          const compatibility = calculateCompatibility(currentUserProfile, profile, prefs)
          return { ...profile, compatibility }
        }) || []
        
        // Sort: Bots first, then by boost status, then compatibility score
        profilesWithCompatibility.sort((a, b) => {
          // Bots always first
          if (a.is_bot && !b.is_bot) return -1
          if (!a.is_bot && b.is_bot) return 1
          // Then boosted profiles
          const aBoosted = boostedProfileIds.includes(a.id)
          const bBoosted = boostedProfileIds.includes(b.id)
          if (aBoosted && !bBoosted) return -1
          if (!aBoosted && bBoosted) return 1
          // Then by compatibility
          return (b.compatibility || 0) - (a.compatibility || 0)
        })
        
        // Always show bots first, then other profiles
        const botProfiles = profilesWithCompatibility.filter(p => p.is_bot)
        const regularProfiles = profilesWithCompatibility.filter(p => !p.is_bot)
        const finalProfiles = [...botProfiles, ...regularProfiles].slice(0, 20)
        
        setFeedProfiles(finalProfiles)
      }
    } catch (error) {
      // Error loading feed
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  const calculateCompatibility = useCallback((currentUser: any, profile: any, prefs: any) => {
    let score = 50 // Base score
    
    // Interest matching (40% weight)
    if (currentUser?.interests && profile?.interests) {
      const currentInterests = Array.isArray(currentUser.interests) ? currentUser.interests : []
      const profileInterests = Array.isArray(profile.interests) ? profile.interests : []
      const commonInterests = currentInterests.filter((i: string) => profileInterests.includes(i))
      const interestScore = (commonInterests.length / Math.max(currentInterests.length, profileInterests.length, 1)) * 40
      score += interestScore
    }
    
    // Distance score (20% weight) - closer is better
    if (profile.distance !== undefined) {
      const maxDistance = prefs?.distance_km || 50
      const distanceScore = Math.max(0, (1 - profile.distance / maxDistance) * 20)
      score += distanceScore
    }
    
    // Age compatibility (20% weight)
    if (currentUser?.birthday && profile?.birthday) {
      const currentAge = new Date().getFullYear() - new Date(currentUser.birthday).getFullYear()
      const profileAge = new Date().getFullYear() - new Date(profile.birthday).getFullYear()
      const ageDiff = Math.abs(currentAge - profileAge)
      const ageScore = Math.max(0, (1 - ageDiff / 20) * 20)
      score += ageScore
    }
    
    // Profile completeness (10% weight)
    const completenessScore = (
      (profile.bio ? 2 : 0) +
      (profile.interests?.length > 0 ? 2 : 0) +
      (profile.media?.length > 0 ? 3 : 0) +
      (profile.verified ? 3 : 0)
    ) * 10 / 10
    score += completenessScore
    
    // Bonus for verified profiles
    if (profile.verified) {
      score += 5
    }
    
    return Math.min(100, Math.max(0, score))
  }, [])

  const handleLike = useCallback(async (kind: 'like' | 'superlike' = 'like') => {
    if (!userId || feedProfiles.length === 0) return

    const profile = feedProfiles[0]
    setLastSwipedProfile(profile)
    setLastSwipeAction(kind)

    try {
      // Insert like
      const { data, error } = await supabase
        .from('likes')
        .insert({
          from_user: userId,
          to_user: profile.id,
          kind
        })
        .select()
        .single()

      if (error) throw error

      // If user liked a bot, make the bot like them back automatically
      if ((profile as any).is_bot) {
        // Add a small delay to make it feel more natural (1-3 seconds)
        const delay = Math.random() * 2000 + 1000 // 1-3 seconds
        
        setTimeout(async () => {
          try {
            // Call API route to make bot like user back (uses service role for security)
            const response = await fetch('/api/bot-like-back', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                botId: profile.id,
                userId: userId
              })
            })

            if (response.ok) {
              // Wait a moment for the database trigger to create the match
              setTimeout(() => {
                setShowMatchModal(profile)
              }, 200)
            }
          } catch (botLikeError) {
            // Error - bot couldn't like back, but user's like was recorded
          }
        }, delay)
      } else {
        // For regular users, check if it's already a match
        const { data: mutualLike } = await supabase
          .from('likes')
          .select('*')
          .eq('from_user', profile.id)
          .eq('to_user', userId)
          .in('kind', ['like', 'superlike'])
          .single()

        if (mutualLike) {
          // It's a match! Wait a moment for the database trigger to create the match
          setTimeout(() => {
            setShowMatchModal(profile)
          }, 100)
        }
      }

      // Track photo engagement for smart photos
      if (profile.media && profile.media.length > 0) {
        const { trackPhotoLike } = await import('@/lib/photoEngagement')
        // Track which photo was shown (first photo by default)
        trackPhotoLike(userId, profile.id, 0)
        
        // Track user behavior for adaptive feed
        const { trackUserBehavior } = await import('@/lib/adaptiveFeed')
        trackUserBehavior(userId, kind === 'superlike' ? 'swipe_superlike' : 'swipe_like', profile.id)
      }

      removeCurrentProfile()
    } catch (error) {
      // Error liking profile
    }
  }, [userId, feedProfiles, removeCurrentProfile, setLastSwipedProfile, setLastSwipeAction, setShowMatchModal])

  const handlePass = useCallback(async () => {
    if (!userId || feedProfiles.length === 0) return

    const profile = feedProfiles[0]
    setLastSwipedProfile(profile)
    setLastSwipeAction('pass')

    try {
      await supabase
        .from('likes')
        .insert({
          from_user: userId,
          to_user: profile.id,
          kind: 'pass'
        })

      // Track user behavior for adaptive feed
      const { trackUserBehavior } = await import('@/lib/adaptiveFeed')
      trackUserBehavior(userId, 'swipe_pass', profile.id)

      removeCurrentProfile()
    } catch (error) {
      // Error passing profile
    }
  }, [userId, feedProfiles, removeCurrentProfile, setLastSwipedProfile, setLastSwipeAction])

  const handleBoost = useCallback(async () => {
    if (!userId || isBoosted) return

    try {
      const endsAt = new Date()
      endsAt.setHours(endsAt.getHours() + 1) // Boost for 1 hour

      await supabase
        .from('boosts')
        .insert({
          user_id: userId,
          ends_at: endsAt.toISOString()
        })

      setIsBoosted(true)
      // Reload feed to show boosted profiles
      loadFeed(userId)
      
      // Reset boost after 1 hour
      setTimeout(() => {
      setIsBoosted(false)
    }, 60 * 60 * 1000)
    } catch (error) {
      // Error boosting
    }
  }, [userId, isBoosted, loadFeed])

  const handleRewind = useCallback(async () => {
    if (!userId || !lastSwipedProfile || !lastSwipeAction) return

    try {
      // Delete the last like/pass
      await supabase
        .from('likes')
        .delete()
        .eq('from_user', userId)
        .eq('to_user', lastSwipedProfile.id)

      // Add profile back to feed
      setFeedProfiles([lastSwipedProfile, ...feedProfiles])

      // Track rewind
      await supabase
        .from('rewinds')
        .insert({
          user_id: userId,
          liked_user_id: lastSwipedProfile.id
        })

      setLastSwipedProfile(null)
      setLastSwipeAction(null)
    } catch (error) {
      // Error rewinding
    }
  }, [userId, lastSwipedProfile, lastSwipeAction, feedProfiles, setFeedProfiles, setLastSwipedProfile, setLastSwipeAction])

  const handleRefresh = useCallback(() => {
    if (userId) {
      loadFeed(userId)
    }
  }, [userId, loadFeed])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="safe-top px-3 py-2.5 flex items-center justify-between border-b border-white/5 bg-dark-card/50 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-9 h-9 rounded-full gradient-red flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold gradient-text">Spark</h1>
            <p className="text-[10px] text-gray-400">Find your match</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSwipedProfile && (
            <motion.button
              onClick={handleRewind}
              className="p-2 hover:bg-white/10 rounded-full transition-all glass"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Undo last swipe"
            >
              <RotateCcw className="w-4 h-4 text-primary-turquoise" />
            </motion.button>
          )}
          <motion.button
            onClick={handleBoost}
            className={`p-2 rounded-full transition-all glass ${isBoosted ? 'gradient-turquoise' : 'hover:bg-white/10'}`}
            disabled={isBoosted}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Boost your profile for 1 hour"
          >
            <Zap className={`w-4 h-4 ${isBoosted ? 'text-white' : 'text-primary-turquoise'}`} />
          </motion.button>
          <motion.button
            onClick={handleRefresh}
            className="p-2 hover:bg-white/10 rounded-full transition-all glass"
            disabled={loading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-turquoise' : 'text-white'}`} />
          </motion.button>
        </div>
      </div>

      {/* Top Picks Section */}
      {topPicks.length > 0 && (
        <div className="px-3 py-2 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary-turquoise fill-primary-turquoise" />
              <h2 className="text-sm font-bold">Top Picks for You</h2>
            </div>
            <button
              onClick={() => setShowTopPicks(!showTopPicks)}
              className="text-xs text-primary-turquoise"
            >
              {showTopPicks ? 'Hide' : 'Show'} ({topPicks.length})
            </button>
          </div>
          {showTopPicks && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {topPicks.map((pick) => (
                <motion.div
                  key={pick.id}
                  className="flex-shrink-0 w-20"
                  onClick={() => {
                    // Add to feed
                    setFeedProfiles([pick, ...feedProfiles])
                    setShowTopPicks(false)
                  }}
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-dark-card mb-1">
                    {pick.media && pick.media.length > 0 ? (
                      <img
                        src={getMediaUrl(pick.media[0].storage_path)}
                        alt={pick.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs">{pick.name[0]}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-center truncate">{pick.name}</p>
                  {pick.compatibility && (
                    <p className="text-[8px] text-center text-primary-turquoise">
                      {Math.round(pick.compatibility)}% match
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 relative px-2 pb-20">
        {feedProfiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-8"
          >
            <motion.div
              className="w-24 h-24 rounded-full glass-strong flex items-center justify-center mb-4 relative"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(25, 211, 197, 0.3)',
                  '0 0 40px rgba(255, 45, 85, 0.3)',
                  '0 0 20px rgba(25, 211, 197, 0.3)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-12 h-12 text-primary-turquoise" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-3 gradient-text">You're All Caught Up!</h2>
            <p className="text-neutral-400 text-sm mb-6 max-w-sm leading-relaxed">
              No more profiles right now. Check back soon or adjust your preferences to see more matches.
            </p>
            <div className="flex gap-3">
              <motion.button
                onClick={handleRefresh}
                className="px-5 py-2.5 text-sm rounded-full gradient-blue text-white font-semibold shadow-lg shadow-primary-blue/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Refresh
              </motion.button>
              <motion.button
                onClick={() => router.push('/settings')}
                className="px-5 py-2.5 text-sm rounded-full glass text-white border border-white/20 font-semibold hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Settings
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="relative w-full mx-auto" style={{ height: 'calc(100vh - 140px)' }}>
            <AnimatePresence mode="wait">
              {feedProfiles.length > 0 && (
                <motion.div
                  key={feedProfiles[0].id}
                  className="absolute inset-0"
                  initial={{ scale: 0.95, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{
                    x: 500,
                    opacity: 0,
                    transition: { duration: 0.3 }
                  }}
                >
                  <ProfileCard
                    profile={feedProfiles[0]}
                    onLike={() => handleLike('like')}
                    onPass={handlePass}
                    onSuperLike={() => handleLike('superlike')}
                    isTop={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Match Modal */}
      <MatchModal
        profile={showMatchModal}
        onClose={() => setShowMatchModal(null)}
        onSendMessage={() => {
          setShowMatchModal(null)
          router.push('/matches')
        }}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

