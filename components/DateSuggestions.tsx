'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, DollarSign, Cloud } from 'lucide-react'
import { generateDateSuggestions } from '@/lib/datePlanning'

interface DateSuggestionsProps {
  userId: string
  otherUserId: string
  onSelect?: (suggestion: any) => void
}

export default function DateSuggestions({ userId, otherUserId, onSelect }: DateSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSuggestions()
  }, [userId, otherUserId])

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const result = await generateDateSuggestions(userId, otherUserId)
      setSuggestions(result)
    } catch (error) {
      console.error('[DateSuggestions] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">Finding perfect date ideas...</div>
    )
  }

  if (suggestions.length === 0) return null

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'high':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary-turquoise" />
        <h3 className="text-lg font-semibold">Date Ideas</h3>
      </div>

      {suggestions.map((suggestion, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelect?.(suggestion)}
          className="glass rounded-xl p-4 border border-white/10 hover:border-primary-blue/50 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm">{suggestion.title}</h4>
            {suggestion.weatherDependent && (
              <Cloud className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">{suggestion.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {suggestion.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{suggestion.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{suggestion.duration}</span>
            </div>
            <div className={`flex items-center gap-1 ${getCostColor(suggestion.cost)}`}>
              <DollarSign className="w-3 h-3" />
              <span className="capitalize">{suggestion.cost}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

