// API route to initialize bots
// Call this once to create all 5 bots in the database

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BOT_PERSONALITIES } from '@/lib/aiBots'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results = []

    // Create welcome bot (AERO Assistant)
    try {
      const { data: existingWelcome } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('name', 'AERO Assistant')
        .eq('is_bot', true)
        .single()

      if (!existingWelcome) {
        // Create auth user for welcome bot
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: 'bot.aero@aero-dating.app',
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: {
            name: 'AERO Assistant',
            is_bot: true
          }
        })

        if (!authError && authUser?.user) {
          // Create welcome bot profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: authUser.user.id,
              name: 'AERO Assistant',
              birthday: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              gender: 'non-binary',
              bio: 'Your friendly AERO dating assistant! I\'m here to help you discover amazing features and find your perfect match. 💫',
              interests: ['Helping', 'Dating', 'Technology', 'Connections'],
              city: 'Everywhere',
              is_bot: true,
              bot_personality: 'tech', // Use tech personality for welcome bot
              verified: true,
              profile_complete: true,
              latitude: 51.5074, // London coordinates as default
              longitude: -0.1278,
              last_active: new Date().toISOString(),
              is_online: true
            })

          if (!profileError) {
            results.push({ 
              name: 'AERO Assistant', 
              status: 'created', 
              id: authUser.user.id 
            })
          } else {
            results.push({ name: 'AERO Assistant', status: 'error', error: profileError.message })
          }
        } else {
          results.push({ name: 'AERO Assistant', status: 'error', error: authError?.message || 'Failed to create auth user' })
        }
      } else {
        results.push({ name: 'AERO Assistant', status: 'exists', id: existingWelcome.id })
      }
    } catch (error: any) {
      results.push({ name: 'AERO Assistant', status: 'error', error: error.message })
    }

    for (const bot of BOT_PERSONALITIES) {
      try {
        // Check if bot already exists
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('name', bot.name)
          .eq('is_bot', true)
          .single()

        if (existing) {
          results.push({ name: bot.name, status: 'exists', id: existing.id })
          continue
        }

        // Create auth user for bot
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: `bot.${bot.name.toLowerCase()}@aero-dating.app`,
          password: crypto.randomUUID(), // Random password (bots don't login)
          email_confirm: true,
          user_metadata: {
            name: bot.name,
            is_bot: true
          }
        })

        if (authError) {
          results.push({ name: bot.name, status: 'error', error: authError.message })
          continue
        }

        if (!authUser.user) {
          results.push({ name: bot.name, status: 'error', error: 'No user created' })
          continue
        }

        // Calculate birthday
        const today = new Date()
        const birthYear = today.getFullYear() - bot.age
        const birthday = new Date(birthYear, today.getMonth(), today.getDate()).toISOString().split('T')[0]

        // Get city coordinates
        const cityCoords: Record<string, { lat: number; lng: number }> = {
          'London': { lat: 51.5074, lng: -0.1278 },
          'Manchester': { lat: 53.4808, lng: -2.2426 },
          'Brighton': { lat: 50.8225, lng: -0.1372 },
          'Edinburgh': { lat: 55.9533, lng: -3.1883 },
          'Oxford': { lat: 51.7520, lng: -1.2577 }
        }

        const coords = cityCoords[bot.city] || cityCoords['London']

        // Create bot profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authUser.user.id,
            name: bot.name,
            birthday: birthday,
            gender: bot.gender,
            bio: bot.bio,
            interests: bot.interests,
            city: bot.city,
            is_bot: true,
            bot_personality: bot.personality,
            verified: true, // Bots are verified
            profile_complete: true,
            latitude: coords.lat,
            longitude: coords.lng,
            last_active: new Date().toISOString(),
            is_online: true
          })

        if (profileError) {
          results.push({ name: bot.name, status: 'error', error: profileError.message })
          // Try to delete auth user if profile creation failed
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
          continue
        }

        // Create preferences for bot
        await supabaseAdmin
          .from('preferences')
          .insert({
            user_id: authUser.user.id,
            age_min: 18,
            age_max: 99,
            distance_km: 200,
            gender_preferences: ['man', 'woman', 'non-binary', 'other'],
            show_me: true
          })

        results.push({ 
          name: bot.name, 
          status: 'created', 
          id: authUser.user.id,
          email: `bot.${bot.name.toLowerCase()}@spark-dating.app`
        })
      } catch (error: any) {
        results.push({ name: bot.name, status: 'error', error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bot initialization complete',
      results
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initialize bots' },
      { status: 500 }
    )
  }
}

// Also allow GET for easy testing
export async function GET() {
  return POST(new Request('', { method: 'POST' }))
}

