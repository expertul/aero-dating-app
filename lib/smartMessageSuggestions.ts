// Smart Message Suggestions - AI-powered conversation starters

import { supabase } from './supabase'
import { BOT_PERSONALITIES } from './aiBots'

interface MessageSuggestion {
  text: string
  type: 'icebreaker' | 'followup' | 'reengagement' | 'date'
  confidence: number
}

export async function generateMessageSuggestions(
  matchId: string,
  userId: string,
  conversationLength: number
): Promise<MessageSuggestion[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get match and other profile
    const { data: match } = await supabase
      .from('matches')
      .select(`
        *,
        profile_a:profiles!matches_user_a_fkey(*),
        profile_b:profiles!matches_user_b_fkey(*)
      `)
      .eq('id', matchId)
      .single()

    if (!match) return []

    const otherProfile = match.user_a === userId ? match.profile_b : match.profile_a

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(10)

    const suggestions: MessageSuggestion[] = []

    // First message - icebreakers
    if (conversationLength === 0) {
      suggestions.push(...generateIcebreakers(otherProfile))
    }
    // Ongoing conversation - follow-ups
    else if (conversationLength > 0 && conversationLength < 10) {
      suggestions.push(...generateFollowUps(otherProfile, messages || []))
    }
    // Stale conversation - re-engagement
    else if (conversationLength > 0) {
      const lastMessage = messages?.[0]
      if (lastMessage) {
        const daysSinceLastMessage = (Date.now() - new Date(lastMessage.created_at).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceLastMessage > 1) {
          suggestions.push(...generateReengagement(otherProfile, lastMessage))
        }
      }
    }

    // Date suggestions (if conversation is going well)
    if (conversationLength > 5) {
      suggestions.push(...generateDateSuggestions(otherProfile))
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  } catch (error) {
    console.error('[SmartSuggestions] Error:', error)
    return []
  }
}

function generateIcebreakers(profile: any): MessageSuggestion[] {
  const suggestions: MessageSuggestion[] = []

  // Based on interests
  if (profile.interests && Array.isArray(profile.interests)) {
    const interests = profile.interests.slice(0, 3)
    interests.forEach((interest: string) => {
      suggestions.push({
        text: `I see you're into ${interest}! What got you started?`,
        type: 'icebreaker',
        confidence: 0.9,
      })
      suggestions.push({
        text: `Hey! I noticed you like ${interest} - that's awesome! What's your favorite part about it?`,
        type: 'icebreaker',
        confidence: 0.85,
      })
    })
  }

  // Based on bio
  if (profile.bio) {
    const bioLower = profile.bio.toLowerCase()
    if (bioLower.includes('travel')) {
      suggestions.push({
        text: 'Hey! I see you love traveling - where\'s your dream destination? ✈️',
        type: 'icebreaker',
        confidence: 0.95,
      })
    }
    if (bioLower.includes('coffee') || bioLower.includes('☕')) {
      suggestions.push({
        text: 'Coffee enthusiast here too! ☕ What\'s your go-to order?',
        type: 'icebreaker',
        confidence: 0.9,
      })
    }
    if (bioLower.includes('music')) {
      suggestions.push({
        text: 'I see you\'re into music! 🎵 What are you listening to lately?',
        type: 'icebreaker',
        confidence: 0.9,
      })
    }
  }

  // Generic but personalized
  suggestions.push({
    text: `Hey ${profile.name}! I'd love to get to know you better. What are you up to this weekend?`,
    type: 'icebreaker',
    confidence: 0.7,
  })

  return suggestions
}

function generateFollowUps(profile: any, messages: any[]): MessageSuggestion[] {
  const suggestions: MessageSuggestion[] = []
  const lastUserMessage = messages.find(m => m.sender_id !== profile.id)

  if (lastUserMessage) {
    const messageText = lastUserMessage.body.toLowerCase()

    // React to what they said
    if (messageText.includes('work') || messageText.includes('job')) {
      suggestions.push({
        text: 'That sounds interesting! What do you enjoy most about your work?',
        type: 'followup',
        confidence: 0.9,
      })
    }
    if (messageText.includes('weekend') || messageText.includes('plan')) {
      suggestions.push({
        text: 'Nice! Any fun plans coming up? I\'d love to hear about them!',
        type: 'followup',
        confidence: 0.85,
      })
    }
    if (messageText.includes('love') || messageText.includes('like') || messageText.includes('enjoy')) {
      suggestions.push({
        text: 'That\'s awesome! Tell me more about that - I\'m curious!',
        type: 'followup',
        confidence: 0.8,
      })
    }
  }

  // Ask about their interests
  if (profile.interests && Array.isArray(profile.interests)) {
    const interest = profile.interests[Math.floor(Math.random() * profile.interests.length)]
    suggestions.push({
      text: `I'd love to know more about your interest in ${interest}! What draws you to it?`,
      type: 'followup',
      confidence: 0.75,
    })
  }

  return suggestions
}

function generateReengagement(profile: any, lastMessage: any): MessageSuggestion[] {
  return [
    {
      text: `Hey ${profile.name}! It's been a while - how have you been?`,
      type: 'reengagement',
      confidence: 0.8,
    },
    {
      text: 'Hey! I was just thinking about our conversation. How are things going?',
      type: 'reengagement',
      confidence: 0.75,
    },
    {
      text: `Hi ${profile.name}! Hope you're doing well. What's new with you?`,
      type: 'reengagement',
      confidence: 0.7,
    },
  ]
}

function generateDateSuggestions(profile: any): MessageSuggestion[] {
  const suggestions: MessageSuggestion[] = []

  // Based on interests
  if (profile.interests && Array.isArray(profile.interests)) {
    const interests = profile.interests

    if (interests.some((i: string) => i.toLowerCase().includes('coffee'))) {
      suggestions.push({
        text: 'I know this great coffee shop - want to grab coffee sometime? ☕',
        type: 'date',
        confidence: 0.9,
      })
    }
    if (interests.some((i: string) => i.toLowerCase().includes('food') || i.toLowerCase().includes('restaurant'))) {
      suggestions.push({
        text: 'I\'d love to take you to this amazing restaurant I know. Interested? 🍽️',
        type: 'date',
        confidence: 0.85,
      })
    }
    if (interests.some((i: string) => i.toLowerCase().includes('art') || i.toLowerCase().includes('museum'))) {
      suggestions.push({
        text: 'There\'s a cool art exhibit happening - want to check it out together? 🎨',
        type: 'date',
        confidence: 0.85,
      })
    }
  }

  // Generic date suggestions
  suggestions.push({
    text: 'I\'d love to meet you in person! Are you free this weekend?',
    type: 'date',
    confidence: 0.7,
  })

  return suggestions
}

