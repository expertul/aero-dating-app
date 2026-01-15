// Welcome Bot - Sends presentation message to new users

import { supabase } from './supabase'

// Welcome bot presentation message
const WELCOME_PRESENTATION = `🎉 Welcome to AERO! 🎉

I'm AERO, your dating assistant! Let me show you what makes our app special:

✨ **Smart Matching**
Our AI-powered algorithm learns your preferences and finds people who truly match your vibe - not just random profiles!

💬 **Real Conversations**
Chat with smart, engaging people. Our conversation quality system helps you connect on a deeper level.

🎯 **TikTok-Style Discovery**
Swipe through profiles like your favorite social feed - fast, fun, and addictive!

📸 **Your Story, Your Way**
Showcase your personality with photos, prompts, and interests that tell your unique story.

🔒 **Safe & Secure**
Your privacy matters. We've built safety features to keep your dating experience positive.

🌟 **Smart Features**
• Compatibility scoring
• Date suggestions
• Conversation insights
• Smart notifications

Ready to find your match? Start swiping and let the magic happen! ✨

Questions? Just ask! I'm here to help. 😊`

// Get or create welcome bot profile
export async function getOrCreateWelcomeBot(): Promise<string | null> {
  try {
    // Check if welcome bot exists
    const { data: existingBot } = await supabase
      .from('profiles')
      .select('id')
      .eq('name', 'AERO Assistant')
      .eq('is_bot', true)
      .single()
    
    if (existingBot) {
      return existingBot.id
    }
    
    // Try to find any bot to use as welcome bot
    const { data: anyBot } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_bot', true)
      .limit(1)
      .single()
    
    if (anyBot) {
      return anyBot.id
    }
    
    return null
  } catch (error) {
    console.error('[Welcome Bot] Error getting welcome bot:', error)
    return null
  }
}

// Send welcome message to new user
export async function sendWelcomeMessage(userId: string): Promise<void> {
  try {
    console.log('[Welcome Bot] Sending welcome message to:', userId.substring(0, 8) + '...')
    
    // Get or create welcome bot
    const botId = await getOrCreateWelcomeBot()
    if (!botId) {
      console.log('[Welcome Bot] No bot available, skipping welcome message')
      return
    }
    
    // Check if match already exists
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user_a.eq.${userId},user_b.eq.${botId}),and(user_a.eq.${botId},user_b.eq.${userId})`)
      .limit(1)
    
    let matchId: string
    
    if (existingMatches && existingMatches.length > 0) {
      matchId = existingMatches[0].id
    } else {
      // Create match
      const userA = userId < botId ? userId : botId
      const userB = userId < botId ? botId : userId
      
      const { data: newMatch, error: matchError } = await supabase
        .from('matches')
        .insert({
          user_a: userA,
          user_b: userB
        })
        .select()
        .single()
      
      if (matchError || !newMatch) {
        console.error('[Welcome Bot] Error creating match:', matchError)
        return
      }
      
      matchId = newMatch.id
    }
    
    // Send welcome message directly (after a short delay)
    setTimeout(async () => {
      try {
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            match_id: matchId,
            sender_id: botId,
            body: WELCOME_PRESENTATION
          })
        
        if (messageError) {
          console.error('[Welcome Bot] Error sending message:', messageError)
        } else {
          console.log('[Welcome Bot] Welcome message sent successfully')
        }
      } catch (error) {
        console.error('[Welcome Bot] Exception sending message:', error)
      }
    }, 2000) // Send after 2 seconds
    
  } catch (error) {
    console.error('[Welcome Bot] Exception sending welcome message:', error)
  }
}
