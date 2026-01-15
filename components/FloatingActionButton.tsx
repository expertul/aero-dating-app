'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Heart, MessageCircle, Star, Video, Camera, MapPin, Gift } from 'lucide-react'
import { useStore } from '@/lib/store'

interface FloatingActionButtonProps {
  className?: string
}

export default function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { showMatchModal, setShowMatchModal } = useStore()

  // Context-aware actions based on current page
  const getActions = () => {
    if (pathname?.startsWith('/feed')) {
      return [
        { icon: Star, label: 'Super Like', color: 'gradient-turquoise', action: () => {/* Handle super like */} },
        { icon: Heart, label: 'Boost Profile', color: 'gradient-red', action: () => {/* Handle boost */} },
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
                    action.action()
                    setIsOpen(false)
                  }}
                  className={`${action.color} text-white p-3 rounded-full shadow-lg flex items-center gap-2 min-w-[140px] justify-start`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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

