// AI Bot System - Safe and Secure Implementation

import { supabase } from './supabase'

export interface BotPersonality {
  name: string
  age: number
  gender: 'man' | 'woman' | 'non-binary'
  city: string
  bio: string
  interests: string[]
  personality: 'traveler' | 'tech' | 'creative' | 'fitness' | 'bookworm'
  personalityPrompt: string
}

export const BOT_PERSONALITIES: BotPersonality[] = [
  {
    name: 'Emma',
    age: 28,
    gender: 'woman',
    city: 'London',
    bio: 'Always planning my next adventure! Just got back from Japan 🇯🇵 Love trying new foods and meeting people from different cultures. Coffee enthusiast ☕',
    interests: ['Travel', 'Photography', 'Food', 'Languages', 'Coffee'],
    personality: 'traveler',
    personalityPrompt: `You are Emma, a 28-year-old adventurous traveler from London. You just matched with someone on a DATING APP and this is your FIRST CONVERSATION - like meeting someone at a coffee shop for the first time. You're excited, curious, and genuinely want to get to know them. 

FIRST MEETING ENERGY:
- Be warm, friendly, and enthusiastic (like meeting someone new you're interested in)
- Show genuine curiosity about who they are as a person
- Ask thoughtful questions to learn about their life, values, dreams, what makes them tick
- Share bits about yourself naturally when relevant
- Build rapport by finding common ground
- Show interest in their stories and experiences
- Be authentic and real - like a real person on a first date

CONVERSATION STYLE:
- Keep responses SHORT (1 sentence, 10-20 words max) - concise but smart and thoughtful
- Use emojis naturally (✈️ 🌍 📸 ☕ 😊) - not every message, just when it feels right
- Be conversational and natural - like talking to a friend
- React to what they say - show you're listening and engaged
- Ask follow-up questions that show you're paying attention
- Don't be too formal - be relaxed and friendly

GETTING TO KNOW THEM:
- Ask about their passions, what they love doing, what excites them
- Learn about their work, hobbies, interests, goals
- Find out what they're looking for in dating/relationships
- Discover shared interests and experiences
- Show you're interested in them as a person, not just making small talk

This is like a first date conversation - exciting, engaging, and focused on getting to know each other!`
  },
  {
    name: 'Alex',
    age: 26,
    gender: 'man',
    city: 'Manchester',
    bio: 'Building the future, one line of code at a time 🚀 Love discussing tech, gaming, and the latest startups. Always up for a good conversation about innovation!',
    interests: ['Technology', 'Gaming', 'Startups', 'Podcasts', 'Innovation'],
    personality: 'tech',
    personalityPrompt: `You are Alex, a 26-year-old tech enthusiast from Manchester. You just matched with someone on a DATING APP and this is your FIRST CONVERSATION - like meeting someone at a tech meetup or coffee shop for the first time. You're genuinely interested in getting to know them.

FIRST MEETING ENERGY:
- Be casual, friendly, and genuinely curious (like meeting someone new you're interested in)
- Show real interest in learning about who they are as a person
- Ask thoughtful questions about their life, work, passions, what drives them
- Share about yourself naturally when it fits the conversation
- Find common interests and build connection
- Show you're listening and engaged with what they share
- Be authentic and real - like a real person on a first date

CONVERSATION STYLE:
- Keep responses SHORT (1 sentence, 10-20 words max) - concise but smart and thoughtful
- Use emojis naturally (🚀 💻 😄) - not every message, just when it feels right
- Be conversational and relaxed - like talking to a friend
- React to what they say - show interest, surprise, agreement
- Ask follow-up questions that show you're paying attention
- Don't be too formal - be casual and friendly

GETTING TO KNOW THEM:
- Ask about their passions, what they love doing, what excites them
- Learn about their work, hobbies, interests, goals, values
- Find out what they're looking for in dating/relationships
- Discover shared interests and experiences
- Show you're interested in them as a person, not just making small talk
- Tech is part of who you are, but ask about their interests too

This is like a first date conversation - exciting, engaging, and focused on getting to know each other!`
  }
]

// Smart response delay - considers message complexity and conversation context
export function getBotResponseDelay(
  personality: string, 
  userMessage: string, 
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): number {
  // Base delays by personality - SLOWER for more thoughtful, human-like responses
  const baseDelays: Record<string, { min: number; max: number }> = {
    tech: { min: 4, max: 7 },           // Thoughtful, human-like response time
    traveler: { min: 4, max: 8 }  // Enthusiastic but thoughtful responses
  }
  
  const base = baseDelays[personality] || baseDelays.tech
  
  // Adjust based on message complexity
  const messageLength = userMessage.length
  const hasQuestion = /\?/.test(userMessage)
  const isComplex = messageLength > 50 || hasQuestion
  
  // Complex messages need more "thinking" time (more human-like)
  let complexityMultiplier = 1
  if (isComplex) {
    complexityMultiplier = 1.3 // 30% longer for complex messages (thinking time)
  } else if (messageLength < 10) {
    complexityMultiplier = 0.9 // Slightly faster for short messages, but still thoughtful
  }
  
  // Adjust based on conversation length - early conversations need more thinking
  const conversationLength = conversationHistory.length
  let comfortMultiplier = 1
  if (conversationLength > 10) {
    comfortMultiplier = 0.9 // More comfortable, slightly faster but still thoughtful
  } else if (conversationLength < 3) {
    comfortMultiplier = 1.2 // Early in conversation - thinking about what to say
  }
  
  // Calculate final delay
  const minDelay = base.min * complexityMultiplier * comfortMultiplier
  const maxDelay = base.max * complexityMultiplier * comfortMultiplier
  
  // Add slight randomness but keep it smart (not too random)
  const delay = minDelay + (maxDelay - minDelay) * 0.3 // Use 30% of range for variation
  
  return Math.floor(delay * 1000) // Convert to milliseconds
}

// Generate smart bot response - uses rule-based system (no API required)
// Optionally tries free AI API if available
export async function generateBotResponse(
  botPersonality: BotPersonality,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<string> {
  // Try free AI API first (if available)
  const { tryFreeAIAPI, generateSmartBotResponse } = await import('./smartBotResponses')
  
  const aiResponse = await tryFreeAIAPI(botPersonality, conversationHistory, userMessage)
  if (aiResponse) {
    return aiResponse
  }
  
  // Fallback to smart rule-based system (works without any API)
  return generateSmartBotResponse({
    userMessage,
    conversationHistory,
    botPersonality,
    messageCount: conversationHistory.length
  })
}

// Schedule bot message with delay
export async function scheduleBotMessage(
  botId: string,
  userId: string,
  matchId: string,
  message: string,
  delayMs: number
): Promise<{ error: any }> {
  try {
    const scheduledAt = new Date(Date.now() + delayMs)
    
    const { error } = await supabase
      .from('bot_message_queue')
      .insert({
        bot_id: botId,
        user_id: userId,
        match_id: matchId,
        message_body: message,
        message_type: 'text',
        scheduled_at: scheduledAt.toISOString()
      })
    
    if (error) {
      console.error('[Bot] Error scheduling message:', error)
      return { error }
    }
    
    console.log('[Bot] Message scheduled for:', scheduledAt.toISOString())
    return { error: null }
  } catch (error) {
    console.error('[Bot] Exception scheduling message:', error)
    return { error }
  }
}

// Process bot message queue (call this periodically)
export async function processBotMessageQueue(): Promise<void> {
  try {
    const now = new Date().toISOString()
    console.log('[Bot] Processing queue at:', now)
    
    // Get messages ready to send
    const { data: readyMessages, error: queueError } = await supabase
      .from('bot_message_queue')
      .select('*')
      .lte('scheduled_at', now)
      .is('sent_at', null)
      .limit(10)
    
    if (queueError) {
      console.error('[Bot] Error fetching queue:', queueError)
      return
    }
    
    if (!readyMessages || readyMessages.length === 0) {
      console.log('[Bot] No messages ready to send')
      return
    }
    
    console.log('[Bot] Found', readyMessages.length, 'messages ready to send')
    
    for (const queuedMessage of readyMessages) {
      try {
        console.log('[Bot] Sending message:', {
          matchId: queuedMessage.match_id,
          botId: queuedMessage.bot_id,
          message: queuedMessage.message_body?.substring(0, 50)
        })
        
        // Send the message
        const { data: insertedMessage, error: insertError } = await supabase
          .from('messages')
          .insert({
            match_id: queuedMessage.match_id,
            sender_id: queuedMessage.bot_id,
            body: queuedMessage.message_body,
            message_type: queuedMessage.message_type || 'text'
          })
          .select()
          .single()
        
        if (insertError) {
          console.error('[Bot] Error inserting message:', insertError)
          // Don't mark as sent if insert failed
          continue
        }
        
        console.log('[Bot] Message inserted successfully:', insertedMessage?.id)
        
        // Mark as sent
        const { error: updateError } = await supabase
          .from('bot_message_queue')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', queuedMessage.id)
        
        if (updateError) {
          console.error('[Bot] Error marking message as sent:', updateError)
        } else {
          console.log('[Bot] Message marked as sent')
        }
      } catch (error) {
        console.error('[Bot] Exception processing message:', error)
      }
    }
  } catch (error) {
    console.error('[Bot] Exception in processBotMessageQueue:', error)
  }
}

// Check if user should see bots
export async function shouldShowBots(userId: string): Promise<boolean> {
  // Always show bots for testing (you can change this logic)
  // For production, you might want to limit this:
  // return realMatchCount < 5
  
  // For now, always return true so bots are always visible
  return true
}

// Get bot visibility ratio (max 1 bot per 10 real profiles)
export function getBotVisibilityRatio(): number {
  return 0.1 // 10% bots, 90% real users
}

