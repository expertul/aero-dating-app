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

      // Get likes
      const { data: likes } = await supabase
        .from('likes')
        .select(`
          id,
          kind,
          created_at,
          from_user,
          to_user,
          from_user_profile:profiles!likes_from_user_fkey(id, name)
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

      // Get matches
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          user_a,
          user_b,
          profile_a:profiles!matches_user_a_fkey(id, name),
          profile_b:profiles!matches_user_b_fkey(id, name)
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

      // Get recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          body,
          created_at,
          match_id,
          sender_id,
          matches!inner(
            profile_a:profiles!matches_user_a_fkey(id, name),
            profile_b:profiles!matches_user_b_fkey(id, name)
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
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 glass border-l border-white/10 shadow-2xl z-[101] flex flex-col max-h-screen"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Activity</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Activities */}
              <div className="flex-1 overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No activity yet</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {activities.map((activity) => (
                      <motion.button
                        key={activity.id}
                        onClick={() => handleActivityClick(activity)}
                        className={`w-full p-3 rounded-lg mb-2 text-left flex items-start gap-3 transition-all ${
                          !activity.read ? 'bg-primary-red/10 border border-primary-red/20' : 'hover:bg-white/5'
                        }`}
                        whileHover={{ x: -4 }}
                      >
                        <div className="mt-0.5 flex-shrink-0">{getIcon(activity.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{activity.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{activity.description}</div>
                        </div>
                        {activity.avatar && (
                          <img
                            src={getMediaUrl(activity.avatar)}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-white/10"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
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

