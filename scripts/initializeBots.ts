// Script to initialize AI bots in the database
// Run this once to create bot profiles
// Requires admin/service role access

import { createClient } from '@supabase/supabase-js'
import { BOT_PERSONALITIES } from '../lib/aiBots'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key (keep secret!)
)

async function initializeBots() {
  console.log('Initializing AI bots...')
  
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
        console.log(`Bot ${bot.name} already exists, skipping...`)
        continue
      }
      
      // Create auth user for bot
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `bot.${bot.name.toLowerCase()}@spark-dating.app`,
        password: crypto.randomUUID(), // Random password (bots don't login)
        email_confirm: true
      })
      
      if (authError) {
        console.error(`Error creating auth user for ${bot.name}:`, authError)
        continue
      }
      
      if (!authUser.user) {
        console.error(`No user created for ${bot.name}`)
        continue
      }
      
      // Create bot profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          name: bot.name,
          birthday: new Date(new Date().setFullYear(new Date().getFullYear() - bot.age)).toISOString().split('T')[0],
          gender: bot.gender,
          bio: bot.bio,
          interests: bot.interests,
          city: bot.city,
          is_bot: true,
          bot_personality: bot.personality,
          verified: true, // Bots are verified
          profile_complete: true,
          // Set location (example coordinates for each city)
          latitude: getCityLatitude(bot.city),
          longitude: getCityLongitude(bot.city)
        })
      
      if (profileError) {
        console.error(`Error creating profile for ${bot.name}:`, profileError)
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
      
      // Add placeholder photos (you'll need to add real photos)
      // For now, we'll skip this - add photos manually or via storage
      
      console.log(`✅ Bot ${bot.name} created successfully!`)
    } catch (error) {
      console.error(`Error initializing bot ${bot.name}:`, error)
    }
  }
  
  console.log('Bot initialization complete!')
}

function getCityLatitude(city: string): number {
  const coordinates: Record<string, number> = {
    'London': 51.5074,
    'Manchester': 53.4808
  }
  return coordinates[city] || 51.5074
}

function getCityLongitude(city: string): number {
  const coordinates: Record<string, number> = {
    'London': -0.1278,
    'Manchester': -2.2426
  }
  return coordinates[city] || -0.1278
}

// Run if called directly
if (require.main === module) {
  initializeBots()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { initializeBots }

