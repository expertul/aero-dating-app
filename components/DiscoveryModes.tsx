'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Zap, Users, MapPin, Calendar, Grid3x3 } from 'lucide-react'

type DiscoveryMode = 'classic' | 'explore' | 'speed' | 'events' | 'groups' | 'incognito'

interface DiscoveryModesProps {
  currentMode: DiscoveryMode
  onModeChange: (mode: DiscoveryMode) => void
}

export default function DiscoveryModes({ currentMode, onModeChange }: DiscoveryModesProps) {
  const [isOpen, setIsOpen] = useState(false)

  const modes: Array<{ id: DiscoveryMode; label: string; icon: any; description: string }> = [
    {
      id: 'classic',
      label: 'Classic',
      icon: Grid3x3,
      description: 'Swipe through profiles',
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Compass,
      description: 'Browse by interests',
    },
    {
      id: 'speed',
      label: 'Speed Dating',
      icon: Zap,
      description: 'Quick 5-min chats',
    },
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      description: 'Match at local events',
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: Users,
      description: 'Join interest groups',
    },
    {
      id: 'incognito',
      label: 'Incognito',
      icon: MapPin,
      description: 'Browse privately',
    },
  ]

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-full glass border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Compass className="w-4 h-4" />
        <span className="text-sm font-medium">{modes.find(m => m.id === currentMode)?.label}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-12 left-0 w-64 glass rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2">
                {modes.map((mode) => {
                  const Icon = mode.icon
                  const isActive = currentMode === mode.id
                  return (
                    <motion.button
                      key={mode.id}
                      onClick={() => {
                        onModeChange(mode.id)
                        setIsOpen(false)
                      }}
                      className={`w-full p-3 rounded-lg mb-1 text-left flex items-start gap-3 transition-all ${
                        isActive ? 'bg-primary-red/20 border border-primary-red/30' : 'hover:bg-white/5'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-primary-red' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${isActive ? 'text-primary-red' : ''}`}>
                          {mode.label}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{mode.description}</div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

