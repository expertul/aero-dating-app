// Bot Service - Handles bot interactions safely

import { supabase } from './supabase'
import { BOT_PERSONALITIES, getBotResponseDelay, generateBotResponse, scheduleBotMessage } from './aiBots'

// Initialize bots in database (run once)
export async function initializeBots(): Promise<void> {
  for (const bot of BOT_PERSONALITIES) {
    // Check if bot already exists
    const { data: existingBot } = await supabase
      .from('profiles')
      .select('id')
      .eq('name', bot.name)
      .eq('is_bot', true)
      .single()
    
    if (existingBot) continue // Bot already exists
    
    // Create auth user for bot (using service role or admin)
    // Note: This requires admin access - handle carefully
    // For now, we'll create profiles directly (requires bypassing RLS)
    
    // Create bot profile
    const botId = crypto.randomUUID()
    
    // Insert bot profile (this would need to be done via admin/service role)
    // For production, use Supabase Admin API or service role
    console.log(`Bot ${bot.name} would be created with ID: ${botId}`)
  }
}

// Handle incoming message from user to bot
// Calls API route to handle bot response (service role key needed)
export async function handleUserMessageToBot(
  botId: string,
  userId: string,
  matchId: string,
  userMessage: string
): Promise<void> {
  console.log('[Bot] ========== HANDLING MESSAGE TO BOT ==========')
  console.log('[Bot] Parameters:', { 
    botId: botId.substring(0, 8) + '...', 
    userId: userId.substring(0, 8) + '...', 
    matchId: matchId.substring(0, 8) + '...', 
    userMessage: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '')
  })
  
  try {
    // Get conversation history for context (optional but helpful)
    console.log('[Bot] 🔍 Fetching conversation history...')
    const { data: recentMessages, error: historyError } = await supabase
      .from('messages')
      .select('sender_id, body, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(10)
    
    if (historyError) {
      console.error('[Bot] ⚠️ Error fetching conversation history:', historyError)
    }
    
    const conversationHistory = (recentMessages || []).map(msg => ({
      role: msg.sender_id === botId ? 'assistant' as const : 'user' as const,
      content: msg.body
    }))
    
    console.log('[Bot] ✅ Conversation history:', conversationHistory.length, 'messages')
    
    // Call API route to handle bot response (has access to service role key)
    console.log('[Bot] 📤 Calling /api/bot-respond...')
    const response = await fetch('/api/bot-respond', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botId,
        userId,
        matchId,
        userMessage,
        conversationHistory
      })
    })
    
    console.log('[Bot] 📥 API response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Bot] ❌ API error:', response.status, errorData)
      throw new Error(`Bot API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }
    
    const data = await response.json()
    console.log('[Bot] ✅ Bot response scheduled:', data)
    console.log('[Bot] ========== HANDLING COMPLETE ==========')
  } catch (error: any) {
    console.error('[Bot] ❌❌❌ ERROR IN handleUserMessageToBot ❌❌❌')
    console.error('[Bot] Error:', error)
    console.error('[Bot] Stack:', error.stack)
    // Don't throw - let it fail silently so user experience isn't affected
  }
}

// Process bot message queue (call this every minute via cron or scheduled function)
export async function processBotQueue(): Promise<void> {
  const { processBotMessageQueue } = await import('./aiBots')
  await processBotMessageQueue()
}

// Check if profile is a bot
export async function isBot(profileId: string): Promise<boolean> {
  try {
    console.log('[Bot] 🔍 Checking if profile is bot:', profileId.substring(0, 8) + '...')
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_bot, name, bot_personality')
      .eq('id', profileId)
      .single()
    
    if (error) {
      console.error('[Bot] ❌ Error checking if bot:', error)
      return false
    }
    
    if (!data) {
      console.log('[Bot] ⚠️ Profile not found:', profileId)
      return false
    }
    
    const isBotResult = data?.is_bot === true
    console.log('[Bot] ✅ Bot check result:', { 
      profileId: profileId.substring(0, 8) + '...', 
      name: data?.name, 
      isBot: isBotResult,
      personality: data?.bot_personality || 'none'
    })
    return isBotResult
  } catch (error) {
    console.error('[Bot] ❌ Exception checking if bot:', error)
    return false
  }
}

// Get bots for feed (respects visibility ratio)
export async function getBotsForFeed(userId: string, limit: number = 2): Promise<any[]> {
  // Check if user should see bots
  const { shouldShowBots } = await import('./aiBots')
  const shouldShow = await shouldShowBots(userId)
  
  if (!shouldShow) return []
  
  // Get bots user hasn't swiped on
  const { data: swipedBots } = await supabase
    .from('likes')
    .select('to_user')
    .eq('from_user', userId)
  
  const excludeIds = swipedBots?.map(s => s.to_user) || []
  
  // Get available bots - exclude already swiped ones
  let query = supabase
    .from('profiles')
    .select(`
      *,
      media:profile_media(*)
    `)
    .eq('is_bot', true)
    .neq('id', userId)
  
  // Filter out swiped bots
  const excludeList = excludeIds.filter(id => id && id !== userId && id !== '')
  if (excludeList.length > 0) {
    query = query.not('id', 'in', `(${excludeList.join(',')})`)
  }
  
  const { data: bots, error } = await query.limit(limit)
  
  // If error or no bots, try fetching all bots and filter manually
  if (error || !bots || bots.length === 0) {
    const { data: allBots } = await supabase
      .from('profiles')
      .select(`
        *,
        media:profile_media(*)
      `)
      .eq('is_bot', true)
      .neq('id', userId)
      .limit(limit)
    
    if (allBots && allBots.length > 0) {
      // Filter out swiped bots manually
      const filteredBots = excludeList.length > 0
        ? allBots.filter(bot => !excludeList.includes(bot.id))
        : allBots
      
      if (filteredBots.length > 0) {
        return await processBots(filteredBots, userId)
      }
      // If all filtered, still return some for testing
      return await processBots(allBots.slice(0, limit), userId)
    }
    return []
  }
  
  // Calculate distance and compatibility for bots
  if (bots && bots.length > 0) {
    // Get user's location
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('latitude, longitude, interests')
      .eq('id', userId)
      .single()
    
    if (userProfile) {
      return bots.map(bot => {
        // Calculate distance if both have coordinates
        let distance: number | undefined
        if (userProfile.latitude && userProfile.longitude && bot.latitude && bot.longitude) {
          const R = 6371 // Earth radius in km
          const dLat = (bot.latitude - userProfile.latitude) * Math.PI / 180
          const dLon = (bot.longitude - userProfile.longitude) * Math.PI / 180
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userProfile.latitude * Math.PI / 180) * Math.cos(bot.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          distance = R * c
        }
        
        // Calculate compatibility
        let compatibility = 70 // Base score for bots
        if (userProfile.interests && bot.interests) {
          const userInterests = Array.isArray(userProfile.interests) ? userProfile.interests : []
          const botInterests = Array.isArray(bot.interests) ? bot.interests : []
          const commonInterests = userInterests.filter((i: string) => botInterests.includes(i))
          compatibility += (commonInterests.length / Math.max(userInterests.length, botInterests.length, 1)) * 30
        }
        
        return {
          ...bot,
          distance,
          compatibility: Math.min(100, compatibility)
        }
      })
    } else {
      // If no user profile, return bots without distance/compatibility
      return bots.map(bot => ({
        ...bot,
        compatibility: 70
      }))
    }
  }
  
  return bots || []
}

// Helper function to process bots (calculate distance, compatibility)
async function processBots(bots: any[], userId: string): Promise<any[]> {
  if (!bots || bots.length === 0) return []
  
  // Get user's location
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('latitude, longitude, interests')
    .eq('id', userId)
    .single()
  
  if (!userProfile) return bots
  
  return bots.map(bot => {
    // Calculate distance if both have coordinates
    let distance: number | undefined
    if (userProfile.latitude && userProfile.longitude && bot.latitude && bot.longitude) {
      const R = 6371 // Earth radius in km
      const dLat = (bot.latitude - userProfile.latitude) * Math.PI / 180
      const dLon = (bot.longitude - userProfile.longitude) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userProfile.latitude * Math.PI / 180) * Math.cos(bot.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      distance = R * c
    }
    
    // Calculate compatibility
    let compatibility = 70 // Base score for bots
    if (userProfile.interests && bot.interests) {
      const userInterests = Array.isArray(userProfile.interests) ? userProfile.interests : []
      const botInterests = Array.isArray(bot.interests) ? bot.interests : []
      const commonInterests = userInterests.filter((i: string) => botInterests.includes(i))
      compatibility += (commonInterests.length / Math.max(userInterests.length, botInterests.length, 1)) * 30
    }
    
    return {
      ...bot,
      distance,
      compatibility: Math.min(100, compatibility)
    }
  })
}

