'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, getMediaUrl } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import BottomNav from '@/components/BottomNav'
import { MessageCircle, Heart, Search, RefreshCw, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Match {
  id: string
  user_a: string
  user_b: string
  created_at: string
  profile: {
    id: string
    name: string
    media: Array<{
      storage_path: string
    }>
  }
  lastMessage?: {
    body: string
    created_at: string
    sender_id: string
  }
  unreadCount: number
  isTyping?: boolean
}

export default function MatchesPage() {
  const router = useRouter()
  const { setUnreadMessageCount, likesYouCount, setLikesYouCount, unreadMessageCount } = useStore()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [likesYou, setLikesYou] = useState<any[]>([])
  const typingChannelsRef = useRef<Map<string, any>>(new Map())
  const isInitialLoad = useRef(true)
  const matchesChannelRef = useRef<any>(null)
  const messagesChannelRef = useRef<any>(null)

  useEffect(() => {
    // Load matches immediately on mount
    loadMatches(false) // false = initial load
  }, [])

  useEffect(() => {
    // Set up subscriptions when userId is available
    if (userId) {
      loadLikesYou() // Load likes you immediately when userId is available
      const unsubscribe = subscribeToMatches()
      
      // Subscribe to likes where user is recipient - use filter for better performance
      const likesChannel = supabase
        .channel(`likes-you-${userId}-${Date.now()}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'likes',
            filter: `to_user=eq.${userId}`
          },
          async (payload) => {
            const newLike = payload.new as any
            // Only update if like is not from current user and not a pass
            if (newLike.from_user !== userId && newLike.kind !== 'pass') {
              // Immediately reload likes you
              setTimeout(() => {
                loadLikesYou()
              }, 300)
              
              // Show browser notification if app is in background
              if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                // Get liker name
                const { data: likerProfile } = await supabase
                  .from('profiles')
                  .select('name')
                  .eq('id', newLike.from_user)
                  .single()
                
                const likerName = likerProfile?.name || 'Someone'
                const likeType = newLike.kind === 'superlike' ? 'super liked' : 'liked'
                
                new Notification(`${likerName} ${likeType} you!`, {
                  body: 'Check your matches to see who liked you',
                  icon: '/icon-192.png',
                  badge: '/icon-192.png',
                  tag: 'spark-like',
                  requireInteraction: false
                })
              }
            }
          }
        )
        .subscribe()
      
      return () => {
        if (unsubscribe) unsubscribe()
        supabase.removeChannel(likesChannel)
      }
    }
  }, [userId])

  // Also add polling to ensure matches are always up to date
  useEffect(() => {
    if (!userId) return
    
    const pollInterval = setInterval(() => {
      loadMatches(true) // Pass true to indicate this is an update, not initial load
      loadLikesYou() // Also poll for new likes
    }, 5000) // Poll every 5 seconds (reduced frequency to prevent flicker)
    
    return () => clearInterval(pollInterval)
  }, [userId])
  
  // Cleanup typing channels on unmount
  useEffect(() => {
    return () => {
      typingChannelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel)
      })
      typingChannelsRef.current.clear()
    }
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const loadMatches = async (isUpdate = false) => {
    const wasInitialLoad = isInitialLoad.current
    try {
      // Only show loading spinner on initial load, not on updates
      if (wasInitialLoad) {
        setLoading(true)
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (wasInitialLoad) {
          setLoading(false)
        }
        router.push('/auth')
        return
      }

      setUserId(user.id)

      // Get matches - try with foreign key joins first
      let { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          profile_a:profiles!matches_user_a_fkey(id, name, media:profile_media(*)),
          profile_b:profiles!matches_user_b_fkey(id, name, media:profile_media(*))
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('created_at', { ascending: false })

      // If foreign key join fails or returns no data, try simpler query
      if (matchesError || !matchesData || matchesData.length === 0) {
        const { data: simpleMatches, error: simpleError } = await supabase
          .from('matches')
          .select('*')
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
          .order('created_at', { ascending: false })
        
        if (simpleError) {
          if (wasInitialLoad) {
            setLoading(false)
            isInitialLoad.current = false
          }
          return
        }
        
        if (simpleMatches && simpleMatches.length > 0) {
          // Fetch profiles manually
          matchesData = await Promise.all(
            simpleMatches.map(async (match) => {
              const otherUserId = match.user_a === user.id ? match.user_b : match.user_a
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, name, media:profile_media(*)')
                .eq('id', otherUserId)
                .single()
              
              return {
                ...match,
                profile_a: match.user_a === user.id ? null : profile,
                profile_b: match.user_b === user.id ? null : profile
              }
            })
          ) as any
        } else {
          setMatches([])
          if (wasInitialLoad) {
            setLoading(false)
            isInitialLoad.current = false
          }
          return
        }
      }

      if (!matchesData || matchesData.length === 0) {
        setMatches([])
        if (wasInitialLoad) {
          setLoading(false)
          isInitialLoad.current = false
        }
        return
      }

      // Get last message and unread count for each match
      const matchesWithMessages = await Promise.all(
        matchesData.map(async (match) => {
          const otherProfile = match.user_a === user.id ? match.profile_b : match.profile_a

          // Check if profile data exists
          if (!otherProfile) {
            // Try to fetch profile manually
            const otherUserId = match.user_a === user.id ? match.user_b : match.user_a
            await supabase
              .from('profiles')
              .select('id, name, media:profile_media(*)')
              .eq('id', otherUserId)
              .single()
          }

          // Get last message
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
          
          const lastMessage = messages && messages.length > 0 ? messages[0] : null

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', match.id)
            .neq('sender_id', user.id)
            .is('read_at', null)

          return {
            ...match,
            profile: otherProfile || { id: match.user_a === user.id ? match.user_b : match.user_a, name: 'Unknown', media: [] },
            lastMessage,
            unreadCount: count || 0
          }
        })
      )

      const matchesList = matchesWithMessages as Match[]
      
      // Set up typing indicators for each match
      matchesList.forEach((match) => {
        const typingChannelName = `typing:${match.id}`
        
        // Remove existing channel if any
        if (typingChannelsRef.current.has(match.id)) {
          supabase.removeChannel(typingChannelsRef.current.get(match.id))
          typingChannelsRef.current.delete(match.id)
        }
        
        // Subscribe to typing presence for this match
        const typingChannel = supabase
          .channel(typingChannelName, {
            config: {
              presence: {
                key: user.id
              }
            }
          })
          .on('presence', { event: 'sync' }, () => {
            const state = typingChannel.presenceState()
            const otherUserId = match.user_a === user.id ? match.user_b : match.user_a
            const otherPresence = state[otherUserId] as any
            
            setMatches((prev) =>
              prev.map((m) =>
                m.id === match.id
                  ? { ...m, isTyping: otherPresence && otherPresence[0]?.typing }
                  : m
              )
            )
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            const otherUserId = match.user_a === user.id ? match.user_b : match.user_a
            if (key === otherUserId && newPresences[0]?.typing) {
              setMatches((prev) =>
                prev.map((m) => (m.id === match.id ? { ...m, isTyping: true } : m))
              )
            }
          })
          .on('presence', { event: 'leave' }, ({ key }) => {
            const otherUserId = match.user_a === user.id ? match.user_b : match.user_a
            if (key === otherUserId) {
              setMatches((prev) =>
                prev.map((m) => (m.id === match.id ? { ...m, isTyping: false } : m))
              )
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await typingChannel.track({
                typing: false,
                userId: user.id
              })
            }
          })
        
        typingChannelsRef.current.set(match.id, typingChannel)
      })
      
      // Only update if data actually changed to prevent unnecessary re-renders
      setMatches((prev) => {
        // If it's an update and we have existing matches, merge intelligently
        if (!isInitialLoad.current && prev.length > 0 && isUpdate) {
          // Create a map of existing matches for quick lookup
          const existingMap = new Map(prev.map(m => [m.id, m]))
          
          // Check if there are new matches (not in existing map)
          const hasNewMatches = matchesList.some(m => !existingMap.has(m.id))
          
          // If there are new matches, always return the full new list to show them
          if (hasNewMatches) {
            return matchesList
          }
          
          // Merge new matches with existing ones, preserving typing state
          const merged = matchesList.map(newMatch => {
            const existing = existingMap.get(newMatch.id)
            if (existing) {
              // Preserve typing state if it exists
              return {
                ...newMatch,
                isTyping: existing.isTyping
              }
            }
            return newMatch
          })
          
          return merged
        }
        
        return matchesList
      })
      
      // Update global unread count
      const totalUnread = matchesList.reduce((sum, match) => sum + (match.unreadCount || 0), 0)
      setUnreadMessageCount(totalUnread)
      
      // Mark initial load as complete
      if (wasInitialLoad) {
        isInitialLoad.current = false
        setLoading(false)
      }
    } catch (error) {
      // Error loading matches
      if (wasInitialLoad) {
        isInitialLoad.current = false
        setLoading(false)
      }
    }
  }

  const loadLikesYou = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLikesYou([])
        setLikesYouCount(0)
        return
      }

      // Get likes where user is the recipient
      const { data: simpleLikes, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .eq('to_user', user.id)
        .neq('from_user', user.id)
        .in('kind', ['like', 'superlike'])
        .order('created_at', { ascending: false })

      if (likesError || !simpleLikes || simpleLikes.length === 0) {
        setLikesYou([])
        setLikesYouCount(0)
        return
      }

      // Get all matches to exclude already matched users
      const { data: matches } = await supabase
        .from('matches')
        .select('user_a, user_b')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

      const matchedUserIds = new Set<string>()
      matches?.forEach(match => {
        if (match.user_a === user.id) matchedUserIds.add(match.user_b)
        if (match.user_b === user.id) matchedUserIds.add(match.user_a)
      })

      // Filter out already matched users
      const unmatchedLikes = simpleLikes.filter(like => !matchedUserIds.has(like.from_user))
      
      if (unmatchedLikes.length === 0) {
        setLikesYou([])
        setLikesYouCount(0)
        return
      }

      // Fetch profiles for all unmatched likes
      const likesWithProfiles = await Promise.all(
        unmatchedLikes.map(async (like) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, media:profile_media(*)')
            .eq('id', like.from_user)
            .single()
          
          return {
            ...like,
            from_user_profile: profile || { id: like.from_user, name: 'Unknown', media: [] }
          }
        })
      )
      
      setLikesYou(likesWithProfiles)
      setLikesYouCount(likesWithProfiles.length)
    } catch (error) {
      // Error loading likes
      setLikesYou([])
      setLikesYouCount(0)
    }
  }

  const handleLikeBack = async (likedUserId: string) => {
    if (!userId) return

    try {
      // Insert like back
      const { error } = await supabase
        .from('likes')
        .insert({
          from_user: userId,
          to_user: likedUserId,
          kind: 'like'
        })

      if (error) throw error

      // Wait a moment for the database trigger to create the match
      setTimeout(async () => {
        // Check if match was created - query with both user IDs
        const { data: allMatches } = await supabase
          .from('matches')
          .select('id, user_a, user_b')
          .or(`user_a.eq.${userId},user_b.eq.${userId}`)

        // Find the match between current user and the liked user
        const match = allMatches?.find(m => 
          (m.user_a === userId && m.user_b === likedUserId) ||
          (m.user_a === likedUserId && m.user_b === userId)
        )

        // Reload likes you to remove the matched user
        loadLikesYou()
        
        // Reload matches to show the new match
        loadMatches(true)
        
        // If match was created, navigate to chat
        if (match) {
          setTimeout(() => {
            router.push(`/chat/${match.id}`)
          }, 300)
        }
      }, 800)
    } catch (error) {
      // Error liking back
    }
  }

  const subscribeToMatches = () => {
    if (!userId) return () => {}

    // Subscribe to new matches where user is involved
    const matchesChannelName = `matches-${userId}-${Date.now()}`
    const matchesChannel = supabase
      .channel(matchesChannelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'matches',
          filter: `user_a=eq.${userId}`
        },
        (payload) => {
          // Immediately refresh matches when a new match is created
          if (payload.eventType === 'INSERT') {
            // Small delay to ensure database has processed the match
            setTimeout(() => {
              loadMatches(true) // Pass true to indicate this is an update
            }, 200)
            // Show browser notification if not on matches page
            if (document.hidden) {
              showBrowserNotification('New Match!', 'You have a new match!')
            }
          } else {
            loadMatches(true)
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'matches',
          filter: `user_b=eq.${userId}`
        },
        (payload) => {
          // Immediately refresh matches when a new match is created
          if (payload.eventType === 'INSERT') {
            // Small delay to ensure database has processed the match
            setTimeout(() => {
              loadMatches(true) // Pass true to indicate this is an update
            }, 200)
            // Show browser notification if not on matches page
            if (document.hidden) {
              showBrowserNotification('New Match!', 'You have a new match!')
            }
          } else {
            loadMatches(true)
          }
        }
      )
      .subscribe()
    
    matchesChannelRef.current = matchesChannel

    // Subscribe to new messages - will be filtered by match_id in handler
    const messagesChannelName = `messages-${userId}-${Date.now()}`
    const messagesChannel = supabase
      .channel(messagesChannelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMsg = payload.new as any
          
          // Check if this message is for one of user's matches
          const { data: match } = await supabase
            .from('matches')
            .select('id, user_a, user_b')
            .eq('id', newMsg.match_id)
            .single()
          
          if (match && (match.user_a === userId || match.user_b === userId)) {
            // Only reload if message is not from current user
            if (newMsg.sender_id !== userId) {
              // Update only the specific match's last message and unread count (optimized)
              setMatches((prev) => {
                return prev.map((m) => {
                  if (m.id === newMsg.match_id) {
                    return {
                      ...m,
                      lastMessage: {
                        body: newMsg.body,
                        created_at: newMsg.created_at,
                        sender_id: newMsg.sender_id
                      },
                      unreadCount: (m.unreadCount || 0) + 1
                    }
                  }
                  return m
                })
              })
              
              // Update global unread count
              setUnreadMessageCount(unreadMessageCount + 1)
              
              // Show browser notification if not on chat/matches page
              if (document.hidden) {
                const { data: otherProfile } = await supabase
                  .from('profiles')
                  .select('name')
                  .eq('id', newMsg.sender_id)
                  .single()
                
                const senderName = otherProfile?.name || 'Someone'
                const messagePreview = newMsg.body === '👋' ? 'sent you a wave' : newMsg.body
                showBrowserNotification(`${senderName} sent a message`, messagePreview)
              }
              
              // Optionally do a background refresh (without showing loading)
              setTimeout(() => {
                loadMatches(true)
              }, 2000)
            }
          }
        }
      )
      .subscribe()

    return () => {
      if (matchesChannelRef.current) {
        supabase.removeChannel(matchesChannelRef.current)
        matchesChannelRef.current = null
      }
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current)
        messagesChannelRef.current = null
      }
    }
  }

  // Browser notification helper
  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'spark-message',
        requireInteraction: false
      })
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const filteredMatches = matches.filter((match) =>
    match.profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-24">
      {/* Header */}
      <div className="safe-top px-3 py-3 border-b border-white/5 bg-dark-card/50 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-2.5">
          <motion.div
            className="w-8 h-8 rounded-full gradient-red flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 0 20px rgba(255, 45, 85, 0.3)',
                '0 0 30px rgba(255, 45, 85, 0.5)',
                '0 0 20px rgba(255, 45, 85, 0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart className="w-4 h-4 text-white fill-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold">Matches</h1>
            <p className="text-[10px] text-gray-400">{matches.length} connections</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matches..."
            className="w-full pl-9 pr-3 py-2 text-sm glass border border-white/10 rounded-xl focus:outline-none focus:border-primary-turquoise transition-all"
          />
        </div>
      </div>

      {/* Likes You Section */}
      {likesYou.length > 0 && (
        <div className="px-3 py-2.5 border-b border-white/5">
          <h2 className="text-sm font-semibold mb-2">Likes You ({likesYou.length})</h2>
          <div className="flex gap-2 overflow-x-auto pb-1.5">
            {likesYou.map((like) => {
              const profile = like.from_user_profile
              const firstPhoto = profile?.media?.[0]?.storage_path
              return (
                <motion.div
                  key={like.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-shrink-0 w-20 text-center"
                >
                  <div 
                    className="relative w-18 h-18 rounded-full overflow-hidden mb-1.5 border-2 border-primary-red mx-auto cursor-pointer"
                    onClick={() => router.push(`/profile/${like.from_user}`)}
                  >
                    {firstPhoto ? (
                      <img
                        src={getMediaUrl(firstPhoto)}
                        alt={profile?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-dark-card flex items-center justify-center">
                        <Heart className="w-6 h-6 text-primary-red" />
                      </div>
                    )}
                    {like.kind === 'superlike' && (
                      <div className="absolute top-0 right-0 bg-primary-turquoise rounded-full p-0.5">
                        <Heart className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] truncate mb-1.5">{profile?.name || 'Unknown'}</p>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLikeBack(like.from_user)
                    }}
                    className="w-full px-2 py-1 text-[10px] font-semibold gradient-red text-white rounded-lg flex items-center justify-center gap-0.5"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart className="w-2.5 h-2.5 fill-white" />
                    Like
                  </motion.button>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Matches List */}
      <div className="px-3 py-2.5">
        {filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-3">
              <Heart className="w-8 h-8 text-primary-red" />
            </div>
            <h2 className="text-base font-bold mb-1.5">No matches yet</h2>
            <p className="text-gray-400 text-xs mb-4">
              {searchQuery
                ? 'No matches found for your search'
                : 'Start swiping to find your perfect match'}
            </p>
            {!searchQuery && (
              <motion.button
                onClick={() => router.push('/feed')}
                className="btn-primary gradient-red text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Swiping
              </motion.button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match) => {
              const profileImage = match.profile.media[0]
                ? getMediaUrl(match.profile.media[0].storage_path)
                : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%231C2128" width="200" height="200"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="20"%3ENo Photo%3C/text%3E%3C/svg%3E'

              return (
                <motion.button
                  key={match.id}
                  onClick={() => router.push(`/chat/${match.id}`)}
                  className="w-full card-modern p-2.5 flex items-center gap-2.5"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <motion.div
                      className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-red shadow-lg"
                      whileHover={{ scale: 1.1 }}
                    >
                      <img
                        src={profileImage}
                        alt={match.profile.name}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    {match.unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full gradient-turquoise flex items-center justify-center text-[10px] font-bold shadow-lg"
                      >
                        {match.unreadCount}
                      </motion.div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-sm">{match.profile.name}</h3>
                    {match.isTyping ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-primary-turquoise">typing</span>
                        <div className="flex gap-0.5">
                          <motion.div
                            className="w-1 h-1 bg-primary-turquoise rounded-full"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="w-1 h-1 bg-primary-turquoise rounded-full"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-1 h-1 bg-primary-turquoise rounded-full"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    ) : match.lastMessage ? (
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {match.lastMessage.sender_id === userId ? 'You: ' : ''}
                        {match.lastMessage.body}
                      </p>
                    ) : (
                      <p className="text-xs text-primary-turquoise">
                        Say hi!
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="text-right">
                    {match.lastMessage ? (
                      <p className="text-[10px] text-gray-500">
                        {formatDistanceToNow(new Date(match.lastMessage.created_at), {
                          addSuffix: true
                        })}
                      </p>
                    ) : (
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

