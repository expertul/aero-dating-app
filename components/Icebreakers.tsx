'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

interface Icebreaker {
  id: string
  question: string
  category: string
}

interface IcebreakersProps {
  matchId: string
  onSend: (message: string) => void
}

export default function Icebreakers({ matchId, onSend }: IcebreakersProps) {
  const [icebreakers, setIcebreakers] = useState<Icebreaker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIcebreakers()
  }, [])

  const loadIcebreakers = async () => {
    try {
      const { data, error } = await supabase
        .from('icebreakers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setIcebreakers(data || [])
    } catch (error) {
      // Error loading icebreakers
    } finally {
      setLoading(false)
    }
  }

  const handleSendIcebreaker = async (question: string) => {
    // Send the icebreaker question directly
    onSend(question)
  }

  if (loading || icebreakers.length === 0) return null

  return (
    <div className="px-3 py-2 border-t border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="w-4 h-4 text-primary-turquoise" />
        <span className="text-xs text-gray-400">Icebreakers</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {icebreakers.slice(0, 5).map((icebreaker) => (
          <motion.button
            key={icebreaker.id}
            onClick={() => handleSendIcebreaker(icebreaker.question)}
            className="px-2.5 py-1.5 text-xs rounded-full glass border border-white/10 hover:border-primary-turquoise transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {icebreaker.question}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

