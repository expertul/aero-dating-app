// Test endpoint to check if bots exist and are visible

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all bots
    const { data: bots, error } = await supabase
      .from('profiles')
      .select('id, name, is_bot, bot_personality, city, gender, bio')
      .eq('is_bot', true)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      botCount: bots?.length || 0,
      bots: bots || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bots' },
      { status: 500 }
    )
  }
}

