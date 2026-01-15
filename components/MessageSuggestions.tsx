'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight } from 'lucide-react'
import { generateMessageSuggestions } from '@/lib/smartMessageSuggestions'

interface MessageSuggestionsProps {
  matchId: string
  userId: string
  conversationLength: number
  onSelect: (suggestion: string) => void
}

export default function MessageSuggestions({ 
  matchId, 
  userId, 
  conversationLength,
  onSelect 
}: MessageSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadSuggestions()
  }, [matchId, conversationLength])

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const result = await generateMessageSuggestions(matchId, userId, conversationLength)
      setSuggestions(result)
    } catch (error) {
      console.error('[MessageSuggestions] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (suggestions.length === 0 && !loading) return null

  const displaySuggestions = showAll ? suggestions : suggestions.slice(0, 3)

  return (
    <div className="px-3 py-2 border-t border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-turquoise" />
          <span className="text-xs text-gray-400">Smart Suggestions</span>
        </div>
        {suggestions.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary-blue hover:text-primary-turquoise transition-colors"
          >
            {showAll ? 'Show Less' : `+${suggestions.length - 3} more`}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-gray-400 text-center py-2">Generating suggestions...</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {displaySuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(suggestion.text)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary-blue/50 transition-all text-xs text-left flex items-center gap-1.5 max-w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="truncate">{suggestion.text}</span>
                <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-400" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

