'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Heart } from 'lucide-react'
import Confetti from 'react-confetti'
import { useEffect, useState } from 'react'
import { getMediaUrl } from '@/lib/supabase'

interface Profile {
  id: string
  name: string
  media: Array<{
    storage_path: string
  }>
}

interface MatchModalProps {
  profile: Profile | null
  onClose: () => void
  onSendMessage: () => void
}

export default function MatchModal({ profile, onClose, onSendMessage }: MatchModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (profile) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [profile])

  if (!profile) return null

  const profileImage = profile.media[0] ? getMediaUrl(profile.media[0].storage_path) : '/placeholder.jpg'

  return (
    <AnimatePresence>
      {profile && (
        <>
          {showConfetti && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={500}
              colors={['#FF2D55', '#2F6BFF', '#19D3C5']}
            />
          )}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="glass rounded-3xl p-8 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="text-center">
              {/* Header */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                className="mb-6"
              >
                <motion.div
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full gradient-red mb-4 shadow-2xl"
                  animate={{
                    boxShadow: [
                      '0 0 30px rgba(255, 45, 85, 0.6)',
                      '0 0 60px rgba(255, 45, 85, 0.8)',
                      '0 0 30px rgba(255, 45, 85, 0.6)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Heart className="w-12 h-12 text-white fill-white" />
                </motion.div>
                <motion.h2
                  className="text-5xl font-black gradient-text mb-3"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  It's a Match!
                </motion.h2>
                <motion.p
                  className="text-gray-300 text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  You and <span className="text-primary-turquoise font-semibold">{profile.name}</span> liked each other
                </motion.p>
              </motion.div>

              {/* Profile Image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <motion.div
                  className="w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-primary-red shadow-2xl"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  animate={{
                    boxShadow: [
                      '0 0 30px rgba(255, 45, 85, 0.4)',
                      '0 0 50px rgba(255, 45, 85, 0.6)',
                      '0 0 30px rgba(255, 45, 85, 0.4)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <img
                    src={profileImage}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <motion.button
                    onClick={onSendMessage}
                    className="w-full btn-primary gradient-turquoise text-white flex items-center justify-center gap-2 font-semibold text-lg"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send a Message
                  </motion.button>

                  <motion.button
                    onClick={onClose}
                    className="w-full px-6 py-3 rounded-full glass border border-white/10 hover:bg-white/10 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Keep Swiping
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

