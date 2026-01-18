'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Heart, MessageCircle, User, Star, Eye } from 'lucide-react'
import { supabase, getMediaUrl } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'like' | 'superlike' | 'match' | 'message' | 'view'
  title: string
  description: string
  timestamp: string
  avatar?: string
  userId?: string
  matchId?: string
  read: boolean
}

export default function ActivityFeed() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadActivities()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        loadActivities()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        loadActivities()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadActivities()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    setUnreadCount(activities.filter(a => !a.read).length)
  }, [activities])

  const loadActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const allActivities: Activity[] = []

      // Get likes with media
      const { data: likes } = await supabase
        .from('likes')
        .select(`
          id,
          kind,
          created_at,
          from_user,
          to_user,
          from_user_profile:profiles!likes_from_user_fkey(
            id, 
            name,
            media:profile_media(storage_path)
          )
        `)
        .eq('to_user', user.id)
        .neq('from_user', user.id)
        .in('kind', ['like', 'superlike'])
        .order('created_at', { ascending: false })
        .limit(10)

      likes?.forEach((like: any) => {
        const profileName = like.from_user_profile?.name || 'Someone'
        allActivities.push({
          id: like.id,
          type: like.kind === 'superlike' ? 'superlike' : 'like',
          title: `${profileName} ${like.kind === 'superlike' ? 'super liked' : 'liked'} you`,
          description: formatDistanceToNow(new Date(like.created_at), { addSuffix: true }),
          timestamp: like.created_at,
          avatar: like.from_user_profile?.media?.[0]?.storage_path,
          userId: like.from_user,
          read: false,
        })
      })

      // Get matches with media
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          user_a,
          user_b,
          profile_a:profiles!matches_user_a_fkey(
            id, 
            name,
            media:profile_media(storage_path)
          ),
          profile_b:profiles!matches_user_b_fkey(
            id, 
            name,
            media:profile_media(storage_path)
          )
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10)

      matches?.forEach((match: any) => {
        const otherProfile = match.user_a === user.id ? match.profile_b : match.profile_a
        const profileName = otherProfile?.name || 'Someone'
        allActivities.push({
          id: match.id,
          type: 'match',
          title: `You matched with ${profileName}!`,
          description: formatDistanceToNow(new Date(match.created_at), { addSuffix: true }),
          timestamp: match.created_at,
          avatar: otherProfile?.media?.[0]?.storage_path,
          matchId: match.id,
          read: false,
        })
      })

      // Get recent messages with media
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          body,
          created_at,
          match_id,
          sender_id,
          user_a,
          user_b,
          matches!inner(
            user_a,
            user_b,
            profile_a:profiles!matches_user_a_fkey(
              id, 
              name,
              media:profile_media(storage_path)
            ),
            profile_b:profiles!matches_user_b_fkey(
              id, 
              name,
              media:profile_media(storage_path)
            )
          )
        `)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      messages?.forEach((msg: any) => {
        const match = msg.matches
        const sender = match?.user_a === user.id ? match?.profile_b : match?.profile_a
        const senderName = sender?.name || 'Someone'
        allActivities.push({
          id: msg.id,
          type: 'message',
          title: `New message from ${senderName}`,
          description: msg.body?.substring(0, 50) || 'New message',
          timestamp: msg.created_at,
          matchId: msg.match_id,
          read: false,
        })
      })

      // Sort by timestamp
      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setActivities(allActivities.slice(0, 20))
    } catch (error) {
      console.error('[ActivityFeed] Error:', error)
    }
  }

  const handleActivityClick = (activity: Activity) => {
    if (activity.matchId) {
      router.push(`/chat/${activity.matchId}`)
    } else if (activity.userId) {
      router.push(`/profile/${activity.userId}`)
    }
    setIsOpen(false)
  }

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-primary-red" />
      case 'superlike':
        return <Star className="w-5 h-5 text-primary-turquoise" />
      case 'match':
        return <Heart className="w-5 h-5 text-primary-red" />
      case 'message':
        return <MessageCircle className="w-5 h-5 text-primary-blue" />
      case 'view':
        return <Eye className="w-5 h-5 text-gray-400" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full glass border border-white/10 hover:bg-white/5 transition-all z-10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-primary-red rounded-full flex items-center justify-center text-xs font-bold text-white z-20"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-0 bg-dark-bg z-[101] flex flex-col"
            >
              {/* Header */}
              <div className="safe-top bg-dark-card border-b border-dark-border px-4 py-3 flex items-center justify-between">
                <h2 className="text-xl font-bold">Activity</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Activities - Full Screen Scrollable */}
              <div className="flex-1 overflow-y-auto pb-20">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-8">
                    <Bell className="w-20 h-20 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                    <p className="text-sm">You'll see likes, matches, and messages here</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {activities.map((activity) => (
                      <motion.button
                        key={activity.id}
                        onClick={() => handleActivityClick(activity)}
                        className={`w-full p-4 rounded-xl text-left flex items-start gap-3 transition-all ${
                          !activity.read 
                            ? 'bg-primary-red/10 border-2 border-primary-red/30' 
                            : 'bg-dark-card hover:bg-white/5 border border-dark-border'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {activity.avatar && (
                          <img
                            src={getMediaUrl(activity.avatar)}
                            alt=""
                            className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-white/20"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base mb-1">{activity.title}</div>
                          <div className="text-sm text-gray-400">{activity.description}</div>
                        </div>
                        <div className="mt-1 flex-shrink-0">{getIcon(activity.type)}</div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

