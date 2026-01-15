// Smart Conversation Quality Score
// Analyze conversation quality and suggest improvements

import { supabase } from './supabase'

interface ConversationMetrics {
  healthScore: number // 0-100
  responseTime: number // Average response time in seconds
  messageLength: number // Average message length
  engagement: number // Engagement level (0-100)
  topics: string[] // Topics discussed
  warnings: string[] // Quality warnings
  suggestions: string[] // Improvement suggestions
}

export async function analyzeConversationQuality(
  matchId: string,
  userId: string
): Promise<ConversationMetrics> {
  try {
    const { data: messages } = await supabase
      .from('messages')
      .select('sender_id, body, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (!messages || messages.length === 0) {
      return {
        healthScore: 0,
        responseTime: 0,
        messageLength: 0,
        engagement: 0,
        topics: [],
        warnings: ['No messages yet'],
        suggestions: ['Start the conversation!']
      }
    }

    // Calculate response times
    const responseTimes: number[] = []
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1]
      const curr = messages[i]
      if (prev.sender_id !== curr.sender_id) {
        const timeDiff = (new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()) / 1000
        responseTimes.push(timeDiff)
      }
    }

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    // Calculate message lengths
    const userMessages = messages.filter(m => m.sender_id === userId)
    const otherMessages = messages.filter(m => m.sender_id !== userId)
    
    const userAvgLength = userMessages.length > 0
      ? userMessages.reduce((sum, m) => sum + m.body.length, 0) / userMessages.length
      : 0
    
    const otherAvgLength = otherMessages.length > 0
      ? otherMessages.reduce((sum, m) => sum + m.body.length, 0) / otherMessages.length
      : 0

    const avgMessageLength = (userAvgLength + otherAvgLength) / 2

    // Detect topics
    const topics = extractTopics(messages.map(m => m.body))

    // Calculate engagement
    const engagement = calculateEngagement(messages, avgResponseTime, avgMessageLength)

    // Calculate health score
    let healthScore = 50 // Base score

    // Response time score (faster is better, but not too fast)
    if (avgResponseTime < 3600) { // Under 1 hour
      healthScore += 20
    } else if (avgResponseTime < 86400) { // Under 24 hours
      healthScore += 10
    } else {
      healthScore -= 10
    }

    // Message length score (longer messages = more engagement)
    if (avgMessageLength > 50) {
      healthScore += 15
    } else if (avgMessageLength > 20) {
      healthScore += 10
    } else if (avgMessageLength < 10) {
      healthScore -= 10
    }

    // Engagement score
    healthScore += engagement * 0.15

    healthScore = Math.max(0, Math.min(100, healthScore))

    // Generate warnings and suggestions
    const warnings: string[] = []
    const suggestions: string[] = []

    if (avgResponseTime > 86400) {
      warnings.push('Slow response times - conversation might be dying')
      suggestions.push('Try responding faster to keep the conversation alive')
    }

    if (avgMessageLength < 10) {
      warnings.push('Very short messages - might seem disinterested')
      suggestions.push('Try sending longer, more engaging messages')
    }

    if (messages.length < 5) {
      warnings.push('Early conversation - keep it going!')
      suggestions.push('Ask questions to learn more about them')
    }

    if (topics.length < 2) {
      warnings.push('Limited topics discussed')
      suggestions.push('Explore different topics to build connection')
    }

    if (healthScore < 50) {
      suggestions.push('Try asking more questions and sharing more about yourself')
    }

    return {
      healthScore: Math.round(healthScore),
      responseTime: Math.round(avgResponseTime),
      messageLength: Math.round(avgMessageLength),
      engagement: Math.round(engagement),
      topics,
      warnings,
      suggestions
    }
  } catch (error) {
    console.error('[ConversationQuality] Error:', error)
    return {
      healthScore: 0,
      responseTime: 0,
      messageLength: 0,
      engagement: 0,
      topics: [],
      warnings: ['Error analyzing conversation'],
      suggestions: []
    }
  }
}

function extractTopics(messages: string[]): string[] {
  const topics = new Set<string>()
  const allText = messages.join(' ').toLowerCase()

  const topicKeywords: Record<string, string[]> = {
    travel: ['travel', 'trip', 'vacation', 'journey', 'adventure', 'visit', 'destination'],
    food: ['food', 'restaurant', 'cooking', 'meal', 'cuisine', 'eat', 'dining'],
    music: ['music', 'song', 'artist', 'concert', 'album', 'listen'],
    movies: ['movie', 'film', 'cinema', 'watch', 'show', 'series'],
    sports: ['sport', 'game', 'team', 'play', 'exercise', 'fitness'],
    work: ['work', 'job', 'career', 'office', 'business', 'project'],
    hobbies: ['hobby', 'interest', 'passion', 'enjoy', 'love doing'],
  }

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => allText.includes(keyword))) {
      topics.add(topic)
    }
  })

  return Array.from(topics)
}

function calculateEngagement(
  messages: any[],
  avgResponseTime: number,
  avgMessageLength: number
): number {
  let engagement = 50

  // More messages = higher engagement
  if (messages.length > 20) engagement += 20
  else if (messages.length > 10) engagement += 10
  else if (messages.length > 5) engagement += 5

  // Faster responses = higher engagement
  if (avgResponseTime < 1800) engagement += 15 // Under 30 min
  else if (avgResponseTime < 3600) engagement += 10 // Under 1 hour

  // Longer messages = higher engagement
  if (avgMessageLength > 50) engagement += 15
  else if (avgMessageLength > 30) engagement += 10

  return Math.max(0, Math.min(100, engagement))
}

