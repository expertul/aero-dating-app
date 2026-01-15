// Smart Feed Algorithm - Learn from swipe patterns and optimize

import { supabase } from './supabase'

interface ProfileScore {
  profile: any
  score: number
  reasons: string[]
}

export async function getSmartFeedProfiles(userId: string, limit: number = 20): Promise<any[]> {
  try {
    // Get user's profile and preferences
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!userProfile) return []

    // Get user's swipe history
    const { data: swipes } = await supabase
      .from('likes')
      .select('to_user, kind, created_at')
      .eq('from_user', userId)

    const likedUserIds = new Set(
      swipes?.filter(s => s.kind === 'like' || s.kind === 'superlike').map(s => s.to_user) || []
    )
    const passedUserIds = new Set(
      swipes?.filter(s => s.kind === 'pass').map(s => s.to_user) || []
    )

    // Analyze what user likes (from their likes)
    const { data: likedProfiles } = await supabase
      .from('profiles')
      .select('interests, age, bio, city')
      .in('id', Array.from(likedUserIds))
      .limit(50)

    // Build preference model
    const preferenceModel = buildPreferenceModel(likedProfiles || [])

    // Get potential matches (exclude already swiped)
    const excludeIds = Array.from(new Set([...likedUserIds, ...passedUserIds, userId]))
    
    let query = supabase
      .from('profiles')
      .select(`
        *,
        media:profile_media(*)
      `)
      .eq('is_bot', false)
      .neq('id', userId)

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }

    const { data: candidates } = await query.limit(limit * 3) // Get more to score and filter

    if (!candidates || candidates.length === 0) return []

    // Score each profile
    const scoredProfiles: ProfileScore[] = candidates.map(profile => {
      const score = calculateProfileScore(profile, userProfile, preferenceModel)
      return {
        profile,
        score: score.total,
        reasons: score.reasons,
      }
    })

    // Sort by score and return top profiles
    return scoredProfiles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(sp => ({
        ...sp.profile,
        compatibility: Math.min(100, Math.round(sp.score)),
        matchReasons: sp.reasons,
      }))
  } catch (error) {
    console.error('[SmartFeed] Error:', error)
    return []
  }
}

function buildPreferenceModel(likedProfiles: any[]): {
  interests: Record<string, number>
  ageRange: { min: number; max: number }
  commonCities: string[]
} {
  const interests: Record<string, number> = {}
  const ages: number[] = []
  const cities: string[] = []

  likedProfiles.forEach(profile => {
    // Count interests
    if (profile.interests && Array.isArray(profile.interests)) {
      profile.interests.forEach((interest: string) => {
        interests[interest] = (interests[interest] || 0) + 1
      })
    }

    // Collect ages
    if (profile.age) {
      ages.push(profile.age)
    }

    // Collect cities
    if (profile.city) {
      cities.push(profile.city)
    }
  })

  // Calculate age range (mean ± 1 standard deviation)
  const ageMean = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 25
  const ageStdDev = ages.length > 0
    ? Math.sqrt(ages.reduce((sq, n) => sq + Math.pow(n - ageMean, 2), 0) / ages.length)
    : 5

  // Most common cities
  const cityCounts: Record<string, number> = {}
  cities.forEach(city => {
    cityCounts[city] = (cityCounts[city] || 0) + 1
  })
  const commonCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city]) => city)

  return {
    interests,
    ageRange: {
      min: Math.max(18, Math.floor(ageMean - ageStdDev)),
      max: Math.min(100, Math.ceil(ageMean + ageStdDev)),
    },
    commonCities,
  }
}

function calculateProfileScore(
  profile: any,
  userProfile: any,
  preferenceModel: ReturnType<typeof buildPreferenceModel>
): { total: number; reasons: string[] } {
  let score = 50 // Base score
  const reasons: string[] = []

  // Interest overlap (weighted)
  if (profile.interests && userProfile.interests) {
    const profileInterests = Array.isArray(profile.interests) ? profile.interests : []
    const userInterests = Array.isArray(userProfile.interests) ? userProfile.interests : []
    const commonInterests = profileInterests.filter((i: string) => userInterests.includes(i))
    
    if (commonInterests.length > 0) {
      const overlapScore = (commonInterests.length / Math.max(profileInterests.length, userInterests.length, 1)) * 30
      score += overlapScore
      reasons.push(`${commonInterests.length} shared interest${commonInterests.length > 1 ? 's' : ''}`)
    }

    // Bonus for preferred interests
    commonInterests.forEach((interest: string) => {
      if (preferenceModel.interests[interest]) {
        score += preferenceModel.interests[interest] * 2
      }
    })
  }

  // Age compatibility
  if (profile.age && userProfile.age) {
    const ageDiff = Math.abs(profile.age - userProfile.age)
    if (ageDiff <= 2) {
      score += 15
      reasons.push('Similar age')
    } else if (ageDiff <= 5) {
      score += 10
    } else if (ageDiff <= 10) {
      score += 5
    }

    // Check if within preferred range
    if (profile.age >= preferenceModel.ageRange.min && profile.age <= preferenceModel.ageRange.max) {
      score += 10
    }
  }

  // Location (same city bonus)
  if (profile.city && userProfile.city && profile.city === userProfile.city) {
    score += 20
    reasons.push('Same city')
  } else if (profile.city && preferenceModel.commonCities.includes(profile.city)) {
    score += 10
  }

  // Bio quality
  if (profile.bio && profile.bio.length > 50) {
    score += 5
  }

  // Photo count (more photos = better)
  if (profile.media && profile.media.length >= 3) {
    score += 5
  }

  // Active recently (if we track this)
  // This would require a last_active_at field

  return {
    total: Math.min(100, score),
    reasons: reasons.slice(0, 3), // Top 3 reasons
  }
}

