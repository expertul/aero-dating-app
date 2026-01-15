'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function BotAdminPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')

  const initializeBots = async () => {
    setLoading(true)
    setError('')
    setResults([])

    try {
      const response = await fetch('/api/init-bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize bots')
      }

      setResults(data.results || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full gradient-turquoise flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bot Initialization</h1>
              <p className="text-gray-400 text-sm">Create 5 AI bots for testing</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              This will create 5 intelligent bots that chat like humans:
            </p>
            <ul className="space-y-2 text-sm text-gray-400 mb-6">
              <li>• <strong className="text-white">Emma</strong> - Traveler from London 🌍</li>
              <li>• <strong className="text-white">Alex</strong> - Tech enthusiast from Manchester 💻</li>
              <li>• <strong className="text-white">Sophia</strong> - Creative artist from Brighton 🎨</li>
              <li>• <strong className="text-white">James</strong> - Fitness trainer from Edinburgh 💪</li>
              <li>• <strong className="text-white">Luna</strong> - Bookworm from Oxford 📚</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <motion.button
            onClick={initializeBots}
            disabled={loading}
            className="w-full py-3 px-6 rounded-full gradient-turquoise text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Creating bots...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Initialize Bots
              </>
            )}
          </motion.button>

          {results.length > 0 && (
            <div className="mt-6 space-y-3">
              <h2 className="text-lg font-semibold mb-3">Results:</h2>
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    result.status === 'created'
                      ? 'bg-green-500/10 border-green-500/50'
                      : result.status === 'exists'
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : 'bg-red-500/10 border-red-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.status === 'created' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : result.status === 'exists' ? (
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="font-semibold">{result.name}</p>
                        <p className="text-xs text-gray-400">
                          {result.status === 'created' && '✅ Created successfully'}
                          {result.status === 'exists' && 'ℹ️ Already exists'}
                          {result.status === 'error' && `❌ Error: ${result.error}`}
                        </p>
                        {result.email && (
                          <p className="text-xs text-gray-500 mt-1">Email: {result.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> After creating bots, they will appear in your feed. 
              You can match with them and chat - they respond intelligently like humans!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

