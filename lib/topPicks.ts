// Top Picks Feature - Curated daily matches

import { supabase } from './supabase'

export interface TopPick {
  id: string
  picked_user_id: string
  compatibility_score: number
  expires_at: string
}

// Generate top picks for a user (curated daily matches)
export async function generateTopPicks(userId: string): Promise<TopPick[]> {
  try {
    // Check if picks already exist for today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingPicks } = await supabase
      .from('top_picks')
      .select('*')
      .eq('user_id', userId)
      .eq('created_date', today)
    
    if (existingPicks && existingPicks.length > 0) {
      return existingPicks
    }
    
    // Get user preferences
    const { data: prefs } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    // Get profiles user has already swiped on
    const { data: swipedIds } = await supabase
      .from('likes')
      .select('to_user')
      .eq('from_user', userId)
    
    const excludeIds = [userId, ...(swipedIds?.map(s => s.to_user) || [])]
    
    // Get blocked users
    const { data: blocked } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId)
    
    if (blocked) {
      excludeIds.push(...blocked.map(b => b.blocked_id))
    }
    
    // Get user's profile for compatibility calculation
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!userProfile) return []
    
    // Get potential matches
    let query = supabase
      .from('profiles')
      .select(`
        *,
        media:profile_media(*)
      `)
      .neq('id', userId)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .eq('is_bot', false) // Exclude bots from top picks
    
    // Apply filters
    if (prefs?.gender_preferences && prefs.gender_preferences.length > 0) {
      query = query.in('gender', prefs.gender_preferences)
    }
    
    const { data: profiles } = await query.limit(100)
    
    if (!profiles || profiles.length === 0) return []
    
    // Calculate compatibility scores
    const profilesWithScores = profiles.map(profile => {
      const compatibility = calculateCompatibility(userProfile, profile, prefs)
      return { ...profile, compatibility }
    })
    
    // Sort by compatibility and take top 6
    const topProfiles = profilesWithScores
      .sort((a, b) => (b.compatibility || 0) - (a.compatibility || 0))
      .slice(0, 6)
    
    // Create top picks records
    const expiresAt = new Date()
    expiresAt.setHours(23, 59, 59, 999) // End of day
    
    const topPicks = topProfiles.map(profile => ({
      user_id: userId,
      picked_user_id: profile.id,
      compatibility_score: profile.compatibility || 0,
      expires_at: expiresAt.toISOString(),
      created_date: today
    }))
    
    // Insert top picks and return the inserted data (with IDs)
    if (topPicks.length > 0) {
      const { data: insertedPicks } = await supabase
        .from('top_picks')
        .insert(topPicks)
        .select()
      
      if (insertedPicks) {
        return insertedPicks
      }
    }
    
    return []
  } catch (error) {
    return []
  }
}

// Calculate compatibility score
function calculateCompatibility(userProfile: any, profile: any, prefs: any): number {
  let score = 50 // Base score
  
  // Interest matching (40% weight)
  if (userProfile?.interests && profile?.interests) {
    const userInterests = Array.isArray(userProfile.interests) ? userProfile.interests : []
    const profileInterests = Array.isArray(profile.interests) ? profile.interests : []
    const commonInterests = userInterests.filter((i: string) => profileInterests.includes(i))
    const interestScore = (commonInterests.length / Math.max(userInterests.length, profileInterests.length, 1)) * 40
    score += interestScore
  }
  
  // Profile completeness (20% weight)
  const completeness = (
    (profile.bio ? 5 : 0) +
    (profile.interests?.length > 0 ? 5 : 0) +
    (profile.media?.length > 0 ? 5 : 0) +
    (profile.verified ? 5 : 0)
  )
  score += completeness
  
  // Distance score (20% weight) - if available
  if (profile.distance !== undefined && prefs?.distance_km) {
    const distanceScore = Math.max(0, (1 - profile.distance / prefs.distance_km) * 20)
    score += distanceScore
  }
  
  // Age compatibility (10% weight)
  if (userProfile?.birthday && profile?.birthday) {
    const userAge = new Date().getFullYear() - new Date(userProfile.birthday).getFullYear()
    const profileAge = new Date().getFullYear() - new Date(profile.birthday).getFullYear()
    const ageDiff = Math.abs(userAge - profileAge)
    const ageScore = Math.max(0, (1 - ageDiff / 20) * 10)
    score += ageScore
  }
  
  // Verification bonus (10% weight)
  if (profile.verified) {
    score += 10
  }
  
  return Math.min(100, Math.max(0, score))
}

// Get top picks for user
export async function getTopPicks(userId: string): Promise<any[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Check if picks exist for today
    const { data: picks } = await supabase
      .from('top_picks')
      .select('*')
      .eq('user_id', userId)
      .eq('created_date', today)
      .gt('expires_at', new Date().toISOString())
      .order('compatibility_score', { ascending: false })
    
    if (picks && picks.length > 0) {
      // Get profiles for picks
      const profileIds = picks.map(p => p.picked_user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          media:profile_media(*)
        `)
        .in('id', profileIds)
      
      if (profiles) {
        // Match profiles with picks
        return picks.map(pick => {
          const profile = profiles.find(p => p.id === pick.picked_user_id)
          return {
            ...profile,
            compatibility: pick.compatibility_score,
            isTopPick: true
          }
        }).filter(p => p.id) // Remove any undefined
      }
    }
    
    // Generate new picks if none exist
    await generateTopPicks(userId)
    
    // Return the newly generated picks
    const { data: newPicks } = await supabase
      .from('top_picks')
      .select('*')
      .eq('user_id', userId)
      .eq('created_date', today)
      .order('compatibility_score', { ascending: false })
    
    if (newPicks && newPicks.length > 0) {
      const profileIds = newPicks.map(p => p.picked_user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          media:profile_media(*)
        `)
        .in('id', profileIds)
      
      if (profiles) {
        return newPicks.map(pick => {
          const profile = profiles.find(p => p.id === pick.picked_user_id)
          return {
            ...profile,
            compatibility: pick.compatibility_score,
            isTopPick: true
          }
        }).filter(p => p.id)
      }
    }
    
    return []
  } catch (error) {
    return []
  }
}

