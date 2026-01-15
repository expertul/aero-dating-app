// API route for bots to respond to user messages
// Uses service role key to bypass RLS
// REBUILT FROM SCRATCH FOR RELIABILITY

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BOT_PERSONALITIES, getBotResponseDelay, generateBotResponse } from '@/lib/aiBots'

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log('[Bot API] ========== NEW BOT REQUEST ==========')
  
  try {
    // 1. Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[Bot API] ❌ Missing environment variables')
      return NextResponse.json(
        { error: 'Service role key not configured', details: 'Missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }
    
    // 2. Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (e) {
      console.error('[Bot API] ❌ Invalid JSON in request body')
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const { botId, userId, matchId, userMessage, conversationHistory: providedHistory } = requestBody
    
    // 3. Validate required parameters
    if (!botId || !userId || !matchId || !userMessage) {
      console.error('[Bot API] ❌ Missing required parameters:', { 
        hasBotId: !!botId, 
        hasUserId: !!userId, 
        hasMatchId: !!matchId, 
        hasUserMessage: !!userMessage 
      })
      return NextResponse.json(
        { error: 'Missing required parameters', details: { botId, userId, matchId, userMessage } },
        { status: 400 }
      )
    }
    
    console.log('[Bot API] ✅ Request validated:', { 
      botId: botId.substring(0, 8) + '...', 
      userId: userId.substring(0, 8) + '...', 
      matchId: matchId.substring(0, 8) + '...', 
      userMessageLength: userMessage.length 
    })
    
    // 4. Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // 5. Fetch bot profile
    console.log('[Bot API] 🔍 Fetching bot profile...')
    const { data: botProfile, error: botError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', botId)
      .eq('is_bot', true)
      .single()
    
    if (botError || !botProfile) {
      console.error('[Bot API] ❌ Bot profile not found:', botError)
      return NextResponse.json(
        { error: 'Bot profile not found', details: botError?.message },
        { status: 404 }
      )
    }
    
    console.log('[Bot API] ✅ Bot profile found:', { 
      name: botProfile.name, 
      personality: botProfile.bot_personality 
    })
    
    // 6. Get conversation history
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
    
    if (providedHistory && Array.isArray(providedHistory) && providedHistory.length > 0) {
      conversationHistory = providedHistory
      console.log('[Bot API] ✅ Using provided conversation history:', conversationHistory.length, 'messages')
    } else {
      console.log('[Bot API] 🔍 Fetching conversation history from database...')
      const { data: messages, error: messagesError } = await supabaseAdmin
        .from('messages')
        .select('sender_id, body, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .limit(20)
      
      if (messagesError) {
        console.error('[Bot API] ⚠️ Error fetching messages:', messagesError)
      } else {
        conversationHistory = (messages || []).map(msg => ({
          role: msg.sender_id === botId ? 'assistant' as const : 'user' as const,
          content: msg.body
        }))
        console.log('[Bot API] ✅ Fetched conversation history:', conversationHistory.length, 'messages')
      }
    }
    
    // 7. Get bot personality
    const botPersonality = BOT_PERSONALITIES.find(
      p => p.personality === botProfile.bot_personality
    )
    
    if (!botPersonality) {
      console.error('[Bot API] ❌ Bot personality not found:', botProfile.bot_personality)
      return NextResponse.json(
        { error: 'Bot personality not found', details: `Personality "${botProfile.bot_personality}" not in BOT_PERSONALITIES` },
        { status: 404 }
      )
    }
    
    console.log('[Bot API] ✅ Bot personality found:', botPersonality.name)
    
    // 8. Generate bot response
    console.log('[Bot API] 🤖 Generating bot response...')
    const botResponse = await generateBotResponse(
      botPersonality,
      conversationHistory,
      userMessage
    )
    
    if (!botResponse || botResponse.trim().length === 0) {
      console.error('[Bot API] ❌ Empty bot response generated')
      return NextResponse.json(
        { error: 'Failed to generate bot response', details: 'generateBotResponse returned empty string' },
        { status: 500 }
      )
    }
    
    console.log('[Bot API] ✅ Generated response:', botResponse.substring(0, 100) + (botResponse.length > 100 ? '...' : ''))
    
    // 9. Get smart response delay (based on message complexity and context)
    const delay = getBotResponseDelay(botPersonality.personality, userMessage, conversationHistory)
    console.log('[Bot API] ⏱️ Smart response delay:', delay, 'ms (message length:', userMessage.length, ', history:', conversationHistory.length, ')')
    
    // 10. Set up typing indicator (non-blocking)
    const typingChannel = supabaseAdmin.channel(`typing:${matchId}`, {
      config: {
        presence: {
          key: botId
        }
      }
    })
    
    typingChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await typingChannel.track({
            typing: true,
            userId: botId
          })
          console.log('[Bot API] ✅ Typing indicator shown')
        } catch (err) {
          console.error('[Bot API] ⚠️ Error showing typing indicator:', err)
        }
      }
    })
    
    // 11. Schedule message send (CRITICAL: Use a more reliable approach)
    // Instead of setTimeout which might fail, we'll use a background task
    // But for now, we'll use setTimeout with better error handling
    
    const messagePromise = new Promise<{ success: boolean; messageId?: string; error?: any }>((resolve) => {
      setTimeout(async () => {
        try {
          console.log('[Bot API] 📤 Sending message to database...')
          
          // Send message
          const { data: sentMessage, error: sendError } = await supabaseAdmin
            .from('messages')
            .insert({
              match_id: matchId,
              sender_id: botId,
              body: botResponse
            })
            .select('id')
            .single()
          
          if (sendError) {
            console.error('[Bot API] ❌ Error sending message:', sendError)
            resolve({ success: false, error: sendError })
            return
          }
          
          console.log('[Bot API] ✅ Message sent successfully! ID:', sentMessage?.id)
          
          // Hide typing indicator
          try {
            await typingChannel.track({
              typing: false,
              userId: botId
            })
            console.log('[Bot API] ✅ Typing indicator hidden')
          } catch (err) {
            console.error('[Bot API] ⚠️ Error hiding typing indicator:', err)
          }
          
          // Update conversation context
          try {
            await supabaseAdmin
              .from('bot_conversations')
              .upsert({
                bot_id: botId,
                user_id: userId,
                match_id: matchId,
                last_bot_message_at: new Date().toISOString(),
                conversation_context: {
                  last_user_message: userMessage,
                  message_count: conversationHistory.length + 1
                }
              }, {
                onConflict: 'bot_id,user_id'
              })
            console.log('[Bot API] ✅ Conversation context updated')
          } catch (err) {
            console.error('[Bot API] ⚠️ Error updating conversation context:', err)
          }
          
          resolve({ success: true, messageId: sentMessage?.id })
        } catch (error: any) {
          console.error('[Bot API] ❌ Exception in message send:', error)
          resolve({ success: false, error: error.message })
        }
      }, delay)
    })
    
    // Handle promise result (but don't await - return immediately)
    messagePromise.then((result) => {
      if (result.success) {
        console.log('[Bot API] ✅✅✅ BOT MESSAGE SUCCESSFULLY SENT ✅✅✅')
      } else {
        console.error('[Bot API] ❌❌❌ BOT MESSAGE FAILED ❌❌❌', result.error)
      }
    }).catch((err) => {
      console.error('[Bot API] ❌❌❌ BOT MESSAGE PROMISE REJECTED ❌❌❌', err)
    })
    
    const elapsed = Date.now() - startTime
    console.log('[Bot API] ⏱️ Request processed in', elapsed, 'ms')
    console.log('[Bot API] ========== REQUEST COMPLETE ==========')
    
    // Return immediately (message will be sent after delay)
    return NextResponse.json({ 
      success: true, 
      message: 'Bot response scheduled',
      delay,
      botResponsePreview: botResponse.substring(0, 50) + '...',
      botName: botPersonality.name
    })
    
  } catch (error: any) {
    console.error('[Bot API] ❌❌❌ EXCEPTION IN BOT-RESPOND ROUTE ❌❌❌')
    console.error('[Bot API] Error:', error)
    console.error('[Bot API] Stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process bot response',
        details: error.stack
      },
      { status: 500 }
    )
  }
}
