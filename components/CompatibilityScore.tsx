'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, TrendingUp, X } from 'lucide-react'
import { calculateCompatibility } from '@/lib/compatibilityScoring'

interface CompatibilityScoreProps {
  userId: string
  otherUserId: string
  onClose?: () => void
}

export default function CompatibilityScore({ userId, otherUserId, onClose }: CompatibilityScoreProps) {
  const [compatibility, setCompatibility] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompatibility()
  }, [userId, otherUserId])

  const loadCompatibility = async () => {
    setLoading(true)
    try {
      const result = await calculateCompatibility(userId, otherUserId)
      setCompatibility(result)
    } catch (error) {
      console.error('[CompatibilityScore] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">Calculating compatibility...</div>
    )
  }

  if (!compatibility) return null

  const scoreColor = compatibility.overall >= 80 ? 'text-primary-turquoise' :
                     compatibility.overall >= 60 ? 'text-primary-blue' :
                     'text-primary-red'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-white/10"
    >
      {onClose && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary-red" />
            Compatibility
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overall Score */}
      <div className="text-center mb-4">
        <div className={`text-5xl font-bold ${scoreColor} mb-2`}>
          {compatibility.overall}%
        </div>
        <div className="text-sm text-gray-400">Overall Compatibility</div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <ScoreBar label="Interests" score={compatibility.interests} color="gradient-red" />
        <ScoreBar label="Lifestyle" score={compatibility.lifestyle} color="gradient-blue" />
        <ScoreBar label="Values" score={compatibility.values} color="gradient-turquoise" />
        <ScoreBar label="Communication" score={compatibility.communication} color="gradient-red" />
        <ScoreBar label="Goals" score={compatibility.goals} color="gradient-blue" />
      </div>

      {/* Details */}
      {compatibility.details.interestOverlap.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-sm font-medium mb-2">Shared Interests</div>
          <div className="flex flex-wrap gap-2">
            {compatibility.details.interestOverlap.map((interest: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-full bg-primary-red/20 text-primary-red text-xs"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {compatibility.details.lifestyleMatch.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-medium mb-2">Lifestyle Match</div>
          <div className="flex flex-wrap gap-2">
            {compatibility.details.lifestyleMatch.map((match: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-full bg-primary-blue/20 text-primary-blue text-xs"
              >
                {match}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-semibold">{score}%</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  )
}

