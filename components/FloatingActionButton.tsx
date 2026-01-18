'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Heart, MessageCircle, Star, Video, Camera, MapPin, Gift, Zap } from 'lucide-react'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

interface FloatingActionButtonProps {
  className?: string
  onSuperLike?: () => void
  onBoost?: () => void
}

export default function FloatingActionButton({ className, onSuperLike, onBoost }: FloatingActionButtonProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { showMatchModal, setShowMatchModal } = useStore()
  const [superLikesLeft, setSuperLikesLeft] = useState(5)
  const [boostsLeft, setBoostsLeft] = useState(3)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUsageLimits()
  }, [])

  const loadUsageLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setUserId(user.id)

      // Get today's date at midnight
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Count super likes today
      const { data: superLikes } = await supabase
        .from('likes')
        .select('id')
        .eq('from_user', user.id)
        .eq('kind', 'superlike')
        .gte('created_at', today.toISOString())

      setSuperLikesLeft(Math.max(0, 5 - (superLikes?.length || 0)))

      // Count boosts today
      const { data: boosts } = await supabase
        .from('boosts')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())

      setBoostsLeft(Math.max(0, 3 - (boosts?.length || 0)))
    } catch (error) {
      console.error('[FloatingActionButton] Error loading limits:', error)
    }
  }

  const handleSuperLike = async () => {
    if (superLikesLeft <= 0) {
      alert('You\'ve used all 5 Super Likes for today! Come back tomorrow.')
      return
    }
    
    if (onSuperLike) {
      onSuperLike()
      setSuperLikesLeft(prev => Math.max(0, prev - 1))
    }
    setIsOpen(false)
  }

  const handleBoost = async () => {
    if (boostsLeft <= 0) {
      alert('You\'ve used all 3 Boosts for today! Come back tomorrow.')
      return
    }

    if (!userId) return

    try {
      const endsAt = new Date()
      endsAt.setHours(endsAt.getHours() + 1)

      await supabase
        .from('boosts')
        .insert({
          user_id: userId,
          ends_at: endsAt.toISOString()
        })

      setBoostsLeft(prev => Math.max(0, prev - 1))
      
      if (onBoost) {
        onBoost()
      }
      
      alert('🚀 Your profile is now boosted for 1 hour!')
    } catch (error) {
      console.error('[FloatingActionButton] Error boosting:', error)
      alert('Failed to boost profile. Please try again.')
    }
    
    setIsOpen(false)
  }

  // Context-aware actions based on current page
  const getActions = () => {
    if (pathname?.startsWith('/feed')) {
      return [
        { 
          icon: Star, 
          label: `Super Like (${superLikesLeft}/5)`, 
          color: 'gradient-turquoise', 
          action: handleSuperLike,
          disabled: superLikesLeft <= 0
        },
        { 
          icon: Zap, 
          label: `Boost (${boostsLeft}/3)`, 
          color: 'gradient-red', 
          action: handleBoost,
          disabled: boostsLeft <= 0
        },
      ]
    }
    if (pathname?.startsWith('/matches')) {
      return [
        { icon: MessageCircle, label: 'New Message', color: 'gradient-blue', action: () => {/* Handle new message */} },
        { icon: Video, label: 'Video Call', color: 'gradient-turquoise', action: () => {/* Handle video call */} },
      ]
    }
    if (pathname?.startsWith('/profile')) {
      return [
        { icon: Camera, label: 'Add Photo', color: 'gradient-blue', action: () => router.push('/profile/edit') },
        { icon: Star, label: 'View Stats', color: 'gradient-turquoise', action: () => router.push('/profile/stats') },
      ]
    }
    if (pathname?.startsWith('/chat/')) {
      return [
        { icon: Camera, label: 'Send Photo', color: 'gradient-blue', action: () => {/* Handle photo */} },
        { icon: Video, label: 'Video Call', color: 'gradient-turquoise', action: () => {/* Handle video */} },
        { icon: MapPin, label: 'Share Location', color: 'gradient-red', action: () => {/* Handle location */} },
        { icon: Gift, label: 'Send Gift', color: 'gradient-turquoise', action: () => {/* Handle gift */} },
      ]
    }
    return []
  }

  const actions = getActions()

  if (actions.length === 0) return null

  return (
    <div className={`fixed bottom-20 right-4 z-50 ${className || ''}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 space-y-2"
          >
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.label}
                  initial={{ scale: 0, opacity: 0, x: 20 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0, opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    if (!(action as any).disabled) {
                      action.action()
                    }
                  }}
                  disabled={(action as any).disabled}
                  className={`${action.color} text-white p-3 rounded-full shadow-lg flex items-center gap-2 min-w-[160px] justify-start ${
                    (action as any).disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  whileHover={(action as any).disabled ? {} : { scale: 1.05 }}
                  whileTap={(action as any).disabled ? {} : { scale: 0.95 }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full gradient-red text-white shadow-2xl flex items-center justify-center`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  )
}

