// API route to make a bot like a user back
// This is called when a user likes a bot

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    const { botId, userId } = await request.json()

    if (!botId || !userId) {
      return NextResponse.json({ error: 'Missing botId or userId' }, { status: 400 })
    }

    // Use service role key to bypass RLS (bots can't authenticate normally)
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the bot exists and is actually a bot
    const { data: botProfile, error: botError } = await supabaseAdmin
      .from('profiles')
      .select('id, is_bot')
      .eq('id', botId)
      .eq('is_bot', true)
      .single()

    if (botError || !botProfile) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Check if bot already liked the user
    const { data: existingLike } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('from_user', botId)
      .eq('to_user', userId)
      .single()

    if (existingLike) {
      // Bot already liked them, match should already exist
      return NextResponse.json({ success: true, alreadyLiked: true })
    }

    // Bot likes user back (always 'like', not 'superlike' to keep it natural)
    const { data: likeData, error: likeError } = await supabaseAdmin
      .from('likes')
      .insert({
        from_user: botId,
        to_user: userId,
        kind: 'like'
      })
      .select()
      .single()

    if (likeError) {
      return NextResponse.json({ error: likeError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, like: likeData })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process bot like' },
      { status: 500 }
    )
  }
}

