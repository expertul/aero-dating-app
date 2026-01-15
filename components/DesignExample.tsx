'use client'

/**
 * DESIGN EXAMPLE COMPONENT
 * 
 * This component demonstrates the professional design improvements
 * outlined in PROFESSIONAL_DESIGN_IMPROVEMENT_PLAN.md
 * 
 * Compare this with existing components to see the difference!
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MapPin, Check, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function DesignExample() {
  const [isLiked, setIsLiked] = useState(false)
  const [showMatch, setShowMatch] = useState(false)

  return (
    <div className="min-h-screen bg-dark-bg p-6 space-y-8">
      {/* Example 1: Enhanced Profile Card */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">
          Example 1: Enhanced Profile Card
        </h2>
        
        <motion.div
          className="relative w-full max-w-sm mx-auto h-[600px] rounded-3xl overflow-hidden
                     shadow-2xl"
          style={{
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `
          }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          {/* Image */}
          <div className="relative h-full bg-gradient-to-br from-primary-red/20 via-primary-blue/20 to-primary-turquoise/20">
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
            
            {/* Photo indicators - Enhanced */}
            <div className="absolute top-6 left-0 right-0 flex items-center justify-center z-30">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full 
                              bg-black/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl">
                {[1, 2, 3, 4].map((_, index) => (
                  <motion.div
                    key={index}
                    className={`rounded-full transition-all ${
                      index === 0
                        ? 'w-3.5 h-3.5 bg-white shadow-lg shadow-white/70 border-2 border-white ring-2 ring-white/50'
                        : 'w-3 h-3 bg-white/80 backdrop-blur-sm border-2 border-white/60'
                    }`}
                    animate={{
                      scale: index === 0 ? 1.3 : 1,
                      opacity: index === 0 ? 1 : 0.7
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                ))}
              </div>
            </div>
            
            {/* Content */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-6 z-10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Sarah
                </h2>
                <motion.div
                  className="w-5 h-5 rounded-full bg-primary-turquoise
                             flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
                <span className="text-xl font-semibold text-white/90">28</span>
              </div>
              
              <div className="flex items-center gap-2 mb-3 text-white/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">New York • 5km away</span>
              </div>
              
              <p className="text-sm text-neutral-300 leading-relaxed line-clamp-2 mb-4">
                Love traveling, photography, and trying new restaurants. 
                Looking for someone to share adventures with!
              </p>
              
              {/* Interests */}
              <div className="flex flex-wrap gap-2 mb-4">
                {['Travel', 'Photography', 'Food'].map((interest, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="px-3 py-1 bg-white/10 backdrop-blur-md
                               rounded-full text-xs font-medium
                               border border-white/20"
                  >
                    {interest}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Example 2: Enhanced Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">
          Example 2: Enhanced Buttons with Micro-interactions
        </h2>
        
        <div className="flex flex-wrap gap-4 justify-center">
          {/* Like Button */}
          <motion.button
            className="relative px-6 py-3 rounded-full font-semibold
                       bg-gradient-to-r from-primary-red to-primary-red/80
                       text-white shadow-lg shadow-primary-red/30
                       overflow-hidden group"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 10px 30px rgba(255, 45, 85, 0.4)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setIsLiked(!isLiked)
              if (!isLiked) setShowMatch(true)
            }}
            animate={isLiked ? {
              scale: [1, 1.3, 1],
              rotate: [0, -10, 10, 0]
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r 
                         from-transparent via-white/20 to-transparent
                         -translate-x-full group-hover:translate-x-full
                         transition-transform duration-1000"
            />
            <span className="relative z-10 flex items-center gap-2">
              <Heart 
                className="w-5 h-5"
                fill={isLiked ? '#FFFFFF' : 'none'}
              />
              Like
            </span>
          </motion.button>

          {/* Pass Button */}
          <motion.button
            className="relative px-6 py-3 rounded-full font-semibold
                       bg-dark-surface border-2 border-white/20
                       text-white shadow-lg
                       overflow-hidden group"
            whileHover={{ 
              scale: 1.02,
              borderColor: 'rgba(255, 255, 255, 0.4)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10">Pass</span>
          </motion.button>

          {/* Super Like Button */}
          <motion.button
            className="relative px-6 py-3 rounded-full font-semibold
                       bg-gradient-to-r from-primary-blue to-primary-turquoise
                       text-white shadow-lg shadow-primary-blue/30
                       overflow-hidden group"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 10px 30px rgba(47, 107, 255, 0.4)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r 
                         from-transparent via-white/20 to-transparent
                         -translate-x-full group-hover:translate-x-full
                         transition-transform duration-1000"
            />
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Super Like
            </span>
          </motion.button>
        </div>
      </section>

      {/* Example 3: Enhanced Input Field */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">
          Example 3: Enhanced Input Field
        </h2>
        
        <div className="max-w-md mx-auto space-y-4">
          <div className="relative">
            <input
              className="w-full px-4 py-3 bg-dark-surface border-2 
                         border-white/10 rounded-xl text-white
                         focus:border-primary-blue focus:ring-4 
                         focus:ring-primary-blue/20 transition-all
                         placeholder:text-neutral-500"
              placeholder="Enter your message..."
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 
                         bg-gradient-to-r from-primary-blue to-primary-turquoise"
              initial={{ scaleX: 0 }}
              whileFocus={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </section>

      {/* Example 4: Match Celebration */}
      <AnimatePresence>
        {showMatch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50
                         flex items-center justify-center"
              onClick={() => setShowMatch(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                  }}
                  className="w-32 h-32 mx-auto mb-6 rounded-full
                             bg-gradient-to-br from-primary-red via-primary-blue to-primary-turquoise
                             flex items-center justify-center shadow-2xl"
                >
                  <Heart className="w-16 h-16 text-white" fill="white" />
                </motion.div>
                
                <motion.h1
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl font-bold text-white mb-4
                             bg-gradient-to-r from-white to-white/80
                             bg-clip-text text-transparent"
                >
                  It's a Match! 💕
                </motion.h1>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-neutral-300 mb-8"
                >
                  Start a conversation now!
                </motion.p>
                
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="px-8 py-4 rounded-full font-semibold
                             bg-gradient-to-r from-primary-red to-primary-red/80
                             text-white shadow-lg shadow-primary-red/30
                             hover:shadow-xl hover:shadow-primary-red/40"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMatch(false)}
                >
                  Send a Message
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Example 5: Card with Hover Effects */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">
          Example 5: Enhanced Card with Hover Effects
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="bg-dark-surface border border-white/10 
                         rounded-2xl p-6 shadow-xl 
                         hover:border-white/20 transition-all duration-300
                         hover:shadow-2xl hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br 
                              from-primary-red to-primary-blue mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">
                Feature {i}
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                This is an example of an enhanced card with smooth
                hover effects and professional styling.
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
