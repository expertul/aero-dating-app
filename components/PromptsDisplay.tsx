'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'

interface Prompt {
  id: string
  prompt_text: string
  answer: string
  display_order: number
}

interface PromptsDisplayProps {
  userId: string
  compact?: boolean
}

export default function PromptsDisplay({ userId, compact = false }: PromptsDisplayProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])

  useEffect(() => {
    loadPrompts()
  }, [userId])

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_prompts')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true })
        .limit(3)

      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      // Error loading prompts
    }
  }

  if (prompts.length === 0) return null

  return (
    <div className={`space-y-2 ${compact ? 'space-y-1' : ''}`}>
      {prompts.map((prompt) => (
        <motion.div
          key={prompt.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass rounded-lg ${compact ? 'p-2' : 'p-3'}`}
        >
          <div className="flex items-start gap-2">
            <MessageSquare className={`text-primary-turquoise flex-shrink-0 ${compact ? 'w-3 h-3 mt-0.5' : 'w-4 h-4 mt-1'}`} />
            <div className="flex-1">
              <p className={`font-semibold mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                {prompt.prompt_text}
              </p>
              <p className={`text-gray-300 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {prompt.answer}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

