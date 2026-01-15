// Adaptive Feed Algorithm
// Learns from user behavior and adapts feed in real-time

import { supabase } from './supabase'

interface UserPreferences {
  preferredAges: { min: number; max: number }
  preferredDistance: number
  preferredInterests: string[]
  preferredGenders: string[]
  swipePatterns: {
    likes: string[]
    passes: string[]
  }
}

// Track user behavior
export async function trackUserBehavior(
  userId: string,
  actionType: 'swipe_like' | 'swipe_pass' | 'swipe_superlike' | 'view_profile' | 'send_message' | 'open_chat',
  targetUserId?: string,
  metadata?: Record<string, any>
) {
  try {
    await supabase
      .from('user_behavior')
      .insert({
        user_id: userId,
        action_type: actionType,
        target_user_id: targetUserId,
        metadata: metadata || {}
      })
  } catch (error) {
    console.error('[AdaptiveFeed] Error tracking behavior:', error)
  }
}

// Learn user preferences from behavior
export async function learnUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    // Get recent swipes (last 100)
    const { data: swipes } = await supabase
      .from('user_behavior')
      .select('action_type, target_user_id, created_at')
      .eq('user_id', userId)
      .in('action_type', ['swipe_like', 'swipe_pass', 'swipe_superlike'])
      .order('created_at', { ascending: false })
      .limit(100)

    if (!swipes || swipes.length === 0) {
      return getDefaultPreferences()
    }

    const likedUserIds = swipes
      .filter(s => s.action_type === 'swipe_like' || s.action_type === 'swipe_superlike')
      .map(s => s.target_user_id)
      .filter(Boolean) as string[]

    const passedUserIds = swipes
      .filter(s => s.action_type === 'swipe_pass')
      .map(s => s.target_user_id)
      .filter(Boolean) as string[]

    // Get profiles of liked users
    const { data: likedProfiles } = await supabase
      .from('profiles')
      .select('age, interests, gender, city, latitude, longitude')
      .in('id', likedUserIds)
      .limit(50)

    // Get user's profile for distance calculation
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('latitude, longitude, age, interests, gender')
      .eq('id', userId)
      .single()

    if (!userProfile) return getDefaultPreferences()

    // Analyze liked profiles to learn preferences
    const ages: number[] = []
    const interests: Record<string, number> = {}
    const genders: Record<string, number> = {}
    const distances: number[] = []

    likedProfiles?.forEach(profile => {
      if (profile.age) ages.push(profile.age)
      if (profile.gender) genders[profile.gender] = (genders[profile.gender] || 0) + 1
      if (profile.interests && Array.isArray(profile.interests)) {
        profile.interests.forEach((interest: string) => {
          interests[interest] = (interests[interest] || 0) + 1
        })
      }
      if (profile.latitude && profile.longitude && userProfile.latitude && userProfile.longitude) {
        const dist = calculateDistance(
          userProfile.latitude,
          userProfile.longitude,
          profile.latitude,
          profile.longitude
        )
        distances.push(dist)
      }
    })

    // Calculate preferences
    const ageMean = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : userProfile.age || 25
    const ageStdDev = ages.length > 0
      ? Math.sqrt(ages.reduce((sq, n) => sq + Math.pow(n - ageMean, 2), 0) / ages.length)
      : 5

    const preferredAges = {
      min: Math.max(18, Math.floor(ageMean - ageStdDev)),
      max: Math.min(100, Math.ceil(ageMean + ageStdDev))
    }

    const preferredDistance = distances.length > 0
      ? Math.ceil(distances.reduce((a, b) => a + b, 0) / distances.length)
      : 50

    const preferredInterests = Object.entries(interests)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([interest]) => interest)

    const preferredGenders = Object.entries(genders)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([gender]) => gender)

    return {
      preferredAges,
      preferredDistance,
      preferredInterests,
      preferredGenders: preferredGenders.length > 0 ? preferredGenders : ['man', 'woman'],
      swipePatterns: {
        likes: likedUserIds,
        passes: passedUserIds
      }
    }
  } catch (error) {
    console.error('[AdaptiveFeed] Error learning preferences:', error)
    return getDefaultPreferences()
  }
}

function getDefaultPreferences(): UserPreferences {
  return {
    preferredAges: { min: 18, max: 100 },
    preferredDistance: 50,
    preferredInterests: [],
    preferredGenders: ['man', 'woman'],
    swipePatterns: {
      likes: [],
      passes: []
    }
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

