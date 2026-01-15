'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Bot, CheckCircle, XCircle } from 'lucide-react'

export default function TestBotsPage() {
  const [bots, setBots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBots()
  }, [])

  const loadBots = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, is_bot, bot_personality, city, gender, bio, interests')
        .eq('is_bot', true)
        .order('name', { ascending: true })

      if (error) throw error
      setBots(data || [])
    } catch (error) {
      console.error('Error loading bots:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bot className="w-8 h-8 text-primary-turquoise" />
            <div>
              <h1 className="text-2xl font-bold">Bot Status Check</h1>
              <p className="text-gray-400 text-sm">
                Found {bots.length} bot{bots.length !== 1 ? 's' : ''} in database
              </p>
            </div>
          </div>

          {bots.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">No Bots Found</p>
              <p className="text-gray-400 mb-6">
                Go to <a href="/admin/bots" className="text-primary-turquoise underline">/admin/bots</a> to create them
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bots.map((bot) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-bold">{bot.name}</h3>
                        <span className="px-2 py-0.5 bg-primary-turquoise/20 text-primary-turquoise text-xs rounded-full">
                          {bot.bot_personality}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p><strong>City:</strong> {bot.city}</p>
                        <p><strong>Gender:</strong> {bot.gender}</p>
                        <p><strong>Bio:</strong> {bot.bio}</p>
                        {bot.interests && bot.interests.length > 0 && (
                          <p><strong>Interests:</strong> {bot.interests.join(', ')}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">ID: {bot.id}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Next Steps:</strong> If bots exist, they should appear in your feed at <a href="/feed" className="underline">/feed</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

