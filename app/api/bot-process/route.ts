// API route to process bot message queue
// Uses service role key to bypass RLS for bot operations

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }
    
    // Use service role client to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const now = new Date().toISOString()
    console.log('[Bot] Processing queue at:', now)
    
    // Get messages ready to send
    const { data: readyMessages, error: queueError } = await supabaseAdmin
      .from('bot_message_queue')
      .select('*')
      .lte('scheduled_at', now)
      .is('sent_at', null)
      .limit(10)
    
    if (queueError) {
      console.error('[Bot] Error fetching queue:', queueError)
      return NextResponse.json(
        { error: queueError.message },
        { status: 500 }
      )
    }
    
    if (!readyMessages || readyMessages.length === 0) {
      console.log('[Bot] No messages ready to send')
      return NextResponse.json({ success: true, processed: 0 })
    }
    
    console.log('[Bot] Found', readyMessages.length, 'messages ready to send')
    
    let processed = 0
    for (const queuedMessage of readyMessages) {
      try {
        console.log('[Bot] Sending message:', {
          matchId: queuedMessage.match_id,
          botId: queuedMessage.bot_id,
          message: queuedMessage.message_body?.substring(0, 50)
        })
        
        // Send the message using service role
        const { data: insertedMessage, error: insertError } = await supabaseAdmin
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
          continue
        }
        
        console.log('[Bot] Message inserted successfully:', insertedMessage?.id)
        
        // Mark as sent
        const { error: updateError } = await supabaseAdmin
          .from('bot_message_queue')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', queuedMessage.id)
        
        if (updateError) {
          console.error('[Bot] Error marking message as sent:', updateError)
        } else {
          processed++
          console.log('[Bot] Message marked as sent')
        }
      } catch (error) {
        console.error('[Bot] Exception processing message:', error)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      processed,
      total: readyMessages.length 
    })
  } catch (error: any) {
    console.error('[Bot] Exception in bot-process route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process bot queue' },
      { status: 500 }
    )
  }
}

// Allow POST as well for webhook calls
export async function POST(request: Request) {
  return GET(request)
}

