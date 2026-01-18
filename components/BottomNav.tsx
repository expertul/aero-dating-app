'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, MessageCircle, User, Settings } from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import SmartSearch from './SmartSearch'
import ActivityFeed from './ActivityFeed'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { unreadMessageCount, setUnreadMessageCount, likesYouCount, setLikesYouCount } = useStore()
  
  // Load unread count on mount and subscribe to updates
  useEffect(() => {
    let userId: string | null = null
    let userMatchIds: string[] = []

    const loadUnreadCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setUnreadMessageCount(0)
          return
        }

        userId = user.id

        // Get all matches for the user
        const { data: matches } = await supabase
          .from('matches')
          .select('id')
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

        if (!matches || matches.length === 0) {
          setUnreadMessageCount(0)
          userMatchIds = []
          return
        }

        userMatchIds = matches.map(m => m.id)

        // Get total unread messages
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('match_id', userMatchIds)
          .neq('sender_id', user.id)
          .is('read_at', null)

        const unreadCount = count || 0
        setUnreadMessageCount(unreadCount)
        console.log('[BottomNav] Unread count updated:', unreadCount)
      } catch (error) {
        console.error('[BottomNav] Error loading unread count:', error)
      }
    }

    loadUnreadCount()

    // Periodic refresh as backup (every 2 seconds for more responsive updates)
    const refreshInterval = setInterval(() => {
      loadUnreadCount()
    }, 2000)

    // Subscribe to message changes with unique channel name
    const channelName = `nav-unread-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: 'read_at=is.null'
        },
        async (payload) => {
          const newMsg = payload.new as any
          
          // Check if message belongs to user's matches and is not from user
          if (userId && newMsg.sender_id !== userId) {
            // Verify it's for one of user's matches
            const { data: match } = await supabase
              .from('matches')
              .select('user_a, user_b')
              .eq('id', newMsg.match_id)
              .single()
            
            if (match && (match.user_a === userId || match.user_b === userId)) {
              console.log('[BottomNav] New message received, updating count')
              // Immediately update count
              setTimeout(() => {
                loadUnreadCount()
              }, 200)
              
              // Show browser notification if app is in background
              if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                // Get sender name
                const { data: senderProfile } = await supabase
                  .from('profiles')
                  .select('name')
                  .eq('id', newMsg.sender_id)
                  .single()
                
                const senderName = senderProfile?.name || 'Someone'
                const messagePreview = newMsg.body === '👋' ? 'sent you a wave' : newMsg.body
                
                new Notification(`${senderName} sent a message`, {
                  body: messagePreview,
                  icon: '/icon-192.png',
                  badge: '/icon-192.png',
                  tag: 'spark-message',
                  requireInteraction: false
                })
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages' 
        },
        async (payload) => {
          const updatedMsg = payload.new as any
          
          // Update count when message is marked as read
          if (userId && updatedMsg.sender_id !== userId) {
            // Verify it's for one of user's matches
            const { data: match } = await supabase
              .from('matches')
              .select('user_a, user_b')
              .eq('id', updatedMsg.match_id)
              .single()
            
            if (match && (match.user_a === userId || match.user_b === userId)) {
              console.log('[BottomNav] Message read status updated')
              setTimeout(() => {
                loadUnreadCount()
              }, 200)
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[BottomNav] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          // Reload count after subscription is active
          setTimeout(() => loadUnreadCount(), 500)
        }
      })

    // Subscribe to likes where current user is the recipient
    const loadLikesYouCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLikesYouCount(0)
          return
        }

        // Get likes where user is the recipient and not yet matched
        const { data: likes } = await supabase
          .from('likes')
          .select('from_user, to_user')
          .eq('to_user', user.id)
          .neq('from_user', user.id)
          .in('kind', ['like', 'superlike'])

        if (!likes || likes.length === 0) {
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

        // Count likes from users who haven't matched yet
        const unmatchedLikes = likes.filter(like => !matchedUserIds.has(like.from_user))
        setLikesYouCount(unmatchedLikes.length)
      } catch (error) {
        // Error loading likes count
      }
    }

    loadLikesYouCount()

    // Periodic refresh for likes count (every 10 seconds)
    const likesRefreshInterval = setInterval(() => {
      loadLikesYouCount()
    }, 10000)

    const likesChannelName = `nav-likes-${Date.now()}`
    const likesChannel = supabase
      .channel(likesChannelName)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'likes',
          filter: 'kind=neq.pass'
        },
        async (payload) => {
          const newLike = payload.new as any
          
          // Only update if like is for current user and not from current user
          if (userId && newLike.to_user === userId && newLike.from_user !== userId && newLike.kind !== 'pass') {
            console.log('[BottomNav] New like received, updating count')
            // Small delay to ensure database is updated
            setTimeout(() => {
              loadLikesYouCount()
            }, 200)
            
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
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: 'spark-like',
                requireInteraction: false
              })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[BottomNav] Likes subscription status:', status)
        if (status === 'SUBSCRIBED') {
          // Reload count after subscription is active
          setTimeout(() => loadLikesYouCount(), 500)
        }
      })

    return () => {
      clearInterval(refreshInterval)
      clearInterval(likesRefreshInterval)
      supabase.removeChannel(channel)
      supabase.removeChannel(likesChannel)
    }
  }, [setUnreadMessageCount, setLikesYouCount])

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/matches', icon: MessageCircle, label: 'Matches' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  // Check if pathname matches or starts with the nav item path
  const isActivePath = (itemPath: string) => {
    if (pathname === itemPath) return true
    // Handle nested routes (e.g., /profile/[userId] should match /profile)
    if (itemPath === '/profile' && pathname?.startsWith('/profile/')) return true
    if (itemPath === '/matches' && pathname?.startsWith('/matches')) return true
    if (itemPath === '/feed' && pathname?.startsWith('/feed')) return true
    if (itemPath === '/settings' && pathname?.startsWith('/settings')) return true
    return false
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 safe-bottom z-40 flex justify-center pb-3 px-4">
      <div className="glass rounded-2xl border border-white/10 shadow-2xl px-1.5 py-1.5">
        <div className="flex items-center gap-0.5">
          {/* Smart Search - Left side */}
          <div className="mr-2">
            <SmartSearch />
          </div>
          
          {navItems.map((item) => {
            const isActive = isActivePath(item.path)
            const Icon = item.icon

            return (
              <motion.button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="relative flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all touch-manipulation min-w-[56px]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 gradient-red rounded-xl opacity-20"
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  />
                )}
                
                <motion.div
                  animate={isActive ? { y: -1 } : { y: 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="relative"
                >
                  <Icon
                    className={`w-5 h-5 transition-all ${
                      isActive ? 'text-white drop-shadow-lg' : 'text-gray-400'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {/* Notification dots on Matches button */}
                  {item.path === '/matches' && (unreadMessageCount > 0 || likesYouCount > 0) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-red rounded-full border-2 border-dark-card shadow-lg"
                    />
                  )}
                </motion.div>
                
                <motion.span
                  className={`text-[10px] font-medium transition-colors whitespace-nowrap ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                  animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                >
                  {item.label}
                </motion.span>
              </motion.button>
            )
          })}
          
          {/* Activity Feed - Right side */}
          <div className="ml-2">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  )
}

