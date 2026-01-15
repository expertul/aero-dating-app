'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, MessageCircle, Heart, Eye, BarChart3, Target, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function ProfileStatsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      setUserId(user.id)

      // Get all stats
      const [
        { data: matches },
        { data: messages },
        { data: likes },
        { data: profileViews },
        { data: sentLikes },
        { data: sentMessages },
      ] = await Promise.all([
        supabase.from('matches').select('id, created_at').or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
        supabase.from('messages').select('id, created_at, read_at').or(`sender_id.eq.${user.id},match_id.in.(select id from matches where user_a.eq.${user.id} or user_b.eq.${user.id})`),
        supabase.from('likes').select('id, kind, created_at').eq('to_user', user.id).neq('from_user', user.id),
        supabase.from('profile_views').select('id, created_at').eq('viewed_id', user.id),
        supabase.from('likes').select('id, kind').eq('from_user', user.id),
        supabase.from('messages').select('id, read_at').eq('sender_id', user.id),
      ])

      // Calculate statistics
      const totalMatches = matches?.length || 0
      const totalMessages = messages?.length || 0
      const totalLikes = likes?.length || 0
      const totalViews = profileViews?.length || 0
      const sentLikesCount = sentLikes?.length || 0
      const sentMessagesCount = sentMessages?.length || 0
      const readMessages = sentMessages?.filter(m => m.read_at).length || 0
      const responseRate = sentMessagesCount > 0 ? (readMessages / sentMessagesCount) * 100 : 0
      const matchRate = sentLikesCount > 0 ? (totalMatches / sentLikesCount) * 100 : 0

      // Active conversations
      const { data: activeMatches } = await supabase
        .from('matches')
        .select('id')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

      const matchIds = activeMatches?.map(m => m.id) || []
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('match_id')
        .in('match_id', matchIds)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const activeConversations = new Set(recentMessages?.map(m => m.match_id)).size

      setStats({
        totalMatches,
        totalMessages,
        totalLikes,
        totalViews,
        sentLikesCount,
        responseRate: Math.round(responseRate),
        matchRate: Math.round(matchRate),
        activeConversations,
        readMessages,
        sentMessagesCount,
      })
    } catch (error) {
      console.error('[Stats] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      {/* Header */}
      <div className="safe-top bg-dark-card border-b border-dark-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Your Stats</h1>
      </div>

      {/* Stats Grid */}
      <div className="p-4 space-y-4">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-primary-red" />
              <TrendingUp className="w-4 h-4 text-primary-turquoise" />
            </div>
            <div className="text-2xl font-bold">{stats?.totalMatches || 0}</div>
            <div className="text-xs text-gray-400">Total Matches</div>
            <div className="text-xs text-primary-turquoise mt-1">
              {stats?.matchRate || 0}% match rate
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageCircle className="w-5 h-5 text-primary-blue" />
              <BarChart3 className="w-4 h-4 text-primary-turquoise" />
            </div>
            <div className="text-2xl font-bold">{stats?.activeConversations || 0}</div>
            <div className="text-xs text-gray-400">Active Chats</div>
            <div className="text-xs text-primary-turquoise mt-1">
              {stats?.responseRate || 0}% response rate
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-primary-red" />
            </div>
            <div className="text-2xl font-bold">{stats?.totalLikes || 0}</div>
            <div className="text-xs text-gray-400">Likes Received</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-primary-turquoise" />
            </div>
            <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
            <div className="text-xs text-gray-400">Profile Views</div>
          </motion.div>
        </div>

        {/* Detailed Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-4 border border-white/10"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-turquoise" />
            Performance Metrics
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Match Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats?.matchRate || 0}%` }}
                    className="h-full gradient-red rounded-full"
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">{stats?.matchRate || 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Response Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats?.responseRate || 0}%` }}
                    className="h-full gradient-blue rounded-full"
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">{stats?.responseRate || 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Messages Sent</span>
              <span className="text-sm font-semibold">{stats?.sentMessagesCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Messages Read</span>
              <span className="text-sm font-semibold">{stats?.readMessages || 0}</span>
            </div>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-4 border border-white/10"
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-turquoise" />
            Tips to Improve
          </h2>
          <div className="space-y-2 text-sm text-gray-300">
            {stats?.matchRate < 20 && (
              <div className="flex items-start gap-2">
                <span className="text-primary-turquoise">•</span>
                <span>Add more photos to your profile to increase match rate</span>
              </div>
            )}
            {stats?.responseRate < 50 && (
              <div className="flex items-start gap-2">
                <span className="text-primary-turquoise">•</span>
                <span>Send more engaging messages to improve response rate</span>
              </div>
            )}
            {stats?.totalViews < 10 && (
              <div className="flex items-start gap-2">
                <span className="text-primary-turquoise">•</span>
                <span>Complete your profile to get more views</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="text-primary-turquoise">•</span>
              <span>Be active daily to boost your visibility</span>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  )
}

