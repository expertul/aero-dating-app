'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, AlertCircle, Lightbulb, MessageCircle } from 'lucide-react'
import { analyzeConversationQuality } from '@/lib/conversationQuality'

interface ConversationQualityWidgetProps {
  matchId: string
  userId: string
}

export default function ConversationQualityWidget({ matchId, userId }: ConversationQualityWidgetProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    loadMetrics()
    // Refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [matchId, userId])

  const loadMetrics = async () => {
    try {
      const result = await analyzeConversationQuality(matchId, userId)
      setMetrics(result)
    } catch (error) {
      console.error('[ConversationQuality] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !metrics) return null

  const healthColor = metrics.healthScore >= 70 ? 'text-primary-turquoise' :
                      metrics.healthScore >= 50 ? 'text-primary-blue' :
                      'text-primary-red'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-3 border border-white/10 mb-2"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary-blue" />
          <span className="text-xs font-medium">Conversation Health</span>
          <span className={`text-xs font-bold ${healthColor}`}>
            {metrics.healthScore}%
          </span>
        </div>
        <TrendingUp className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-2"
        >
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Response Time:</span>
              <span className="ml-1 font-medium">
                {metrics.responseTime < 60 ? `${Math.round(metrics.responseTime)}s` :
                 metrics.responseTime < 3600 ? `${Math.round(metrics.responseTime / 60)}m` :
                 `${Math.round(metrics.responseTime / 3600)}h`}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Avg Length:</span>
              <span className="ml-1 font-medium">{Math.round(metrics.messageLength)} chars</span>
            </div>
          </div>

          {/* Warnings */}
          {metrics.warnings.length > 0 && (
            <div className="flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <div>
                {metrics.warnings.map((warning: string, idx: number) => (
                  <div key={idx} className="text-yellow-500">{warning}</div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {metrics.suggestions.length > 0 && (
            <div className="flex items-start gap-2 text-xs">
              <Lightbulb className="w-4 h-4 text-primary-turquoise mt-0.5" />
              <div>
                {metrics.suggestions.map((suggestion: string, idx: number) => (
                  <div key={idx} className="text-primary-turquoise">{suggestion}</div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

