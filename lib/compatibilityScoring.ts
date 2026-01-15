// Advanced Compatibility Scoring - Deep analysis

import { supabase } from './supabase'

interface CompatibilityBreakdown {
  overall: number
  interests: number
  lifestyle: number
  values: number
  communication: number
  goals: number
  details: {
    interestOverlap: string[]
    lifestyleMatch: string[]
    valueAlignment: string[]
    communicationStyle: string
    goalCompatibility: string
  }
}

export async function calculateCompatibility(
  userId: string,
  otherUserId: string
): Promise<CompatibilityBreakdown> {
  try {
    // Get both profiles
    const [
      { data: userProfile },
      { data: otherProfile },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('profiles').select('*').eq('id', otherUserId).single(),
    ])

    if (!userProfile || !otherProfile) {
      return getEmptyCompatibility()
    }

    // Calculate interest overlap
    const userInterests = Array.isArray(userProfile.interests) ? userProfile.interests : []
    const otherInterests = Array.isArray(otherProfile.interests) ? otherProfile.interests : []
    const commonInterests = userInterests.filter((i: string) => otherInterests.includes(i))
    const interestScore = userInterests.length > 0 && otherInterests.length > 0
      ? (commonInterests.length / Math.max(userInterests.length, otherInterests.length)) * 100
      : 50

    // Lifestyle compatibility (age, city, activity level)
    let lifestyleScore = 50
    const lifestyleMatches: string[] = []

    // Age compatibility
    if (userProfile.age && otherProfile.age) {
      const ageDiff = Math.abs(userProfile.age - otherProfile.age)
      if (ageDiff <= 2) {
        lifestyleScore += 20
        lifestyleMatches.push('Similar age')
      } else if (ageDiff <= 5) {
        lifestyleScore += 10
      }
    }

    // Location compatibility
    if (userProfile.city && otherProfile.city) {
      if (userProfile.city === otherProfile.city) {
        lifestyleScore += 15
        lifestyleMatches.push('Same city')
      }
    }

    // Activity level (based on interests)
    const activeInterests = ['Fitness', 'Sports', 'Outdoor Activities', 'Travel']
    const userActive = userInterests.some((i: string) => activeInterests.includes(i))
    const otherActive = otherInterests.some((i: string) => activeInterests.includes(i))
    if (userActive === otherActive) {
      lifestyleScore += 10
      lifestyleMatches.push('Similar activity level')
    }

    lifestyleScore = Math.min(100, lifestyleScore)

    // Values compatibility (based on bio keywords)
    let valuesScore = 50
    const valueMatches: string[] = []

    const userBio = (userProfile.bio || '').toLowerCase()
    const otherBio = (otherProfile.bio || '').toLowerCase()

    const valueKeywords = {
      family: ['family', 'close', 'relationships'],
      career: ['career', 'work', 'professional', 'ambitious'],
      adventure: ['adventure', 'travel', 'explore', 'experience'],
      creativity: ['creative', 'art', 'music', 'design'],
    }

    Object.entries(valueKeywords).forEach(([value, keywords]: [string, string[]]) => {
      const userHas = keywords.some(k => userBio.includes(k))
      const otherHas = keywords.some(k => otherBio.includes(k))
      if (userHas && otherHas) {
        valuesScore += 12.5
        valueMatches.push(value.charAt(0).toUpperCase() + value.slice(1))
      }
    })

    valuesScore = Math.min(100, valuesScore)

    // Communication style (based on message patterns if available)
    let communicationScore = 70 // Default
    let communicationStyle = 'Balanced'

    // Analyze message history if available
    const { data: messages } = await supabase
      .from('messages')
      .select('sender_id, body, created_at')
      .or(`sender_id.eq.${userId},sender_id.eq.${otherUserId}`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (messages && messages.length > 0) {
      const userMessages = messages.filter(m => m.sender_id === userId)
      const otherMessages = messages.filter(m => m.sender_id === otherUserId)

      const userAvgLength = userMessages.length > 0
        ? userMessages.reduce((sum, m) => sum + m.body.length, 0) / userMessages.length
        : 0
      const otherAvgLength = otherMessages.length > 0
        ? otherMessages.reduce((sum, m) => sum + m.body.length, 0) / otherMessages.length
        : 0

      const lengthDiff = Math.abs(userAvgLength - otherAvgLength)
      if (lengthDiff < 20) {
        communicationScore = 85
        communicationStyle = 'Similar communication style'
      } else if (lengthDiff < 50) {
        communicationScore = 75
        communicationStyle = 'Compatible communication'
      }
    }

    // Goals compatibility (relationship goals if available)
    let goalsScore = 70 // Default
    let goalCompatibility = 'Compatible goals'

    // This would require a relationship_goals field in profiles
    // For now, use bio analysis
    const relationshipKeywords = ['serious', 'long-term', 'relationship', 'commitment', 'casual', 'fun']
    const userHasGoals = relationshipKeywords.some(k => userBio.includes(k))
    const otherHasGoals = relationshipKeywords.some(k => otherBio.includes(k))

    if (userHasGoals && otherHasGoals) {
      goalsScore = 80
      goalCompatibility = 'Similar relationship goals'
    }

    // Calculate overall (weighted average)
    const overall = Math.round(
      interestScore * 0.25 +
      lifestyleScore * 0.25 +
      valuesScore * 0.20 +
      communicationScore * 0.15 +
      goalsScore * 0.15
    )

    return {
      overall,
      interests: Math.round(interestScore),
      lifestyle: Math.round(lifestyleScore),
      values: Math.round(valuesScore),
      communication: Math.round(communicationScore),
      goals: Math.round(goalsScore),
      details: {
        interestOverlap: commonInterests.slice(0, 5),
        lifestyleMatch: lifestyleMatches,
        valueAlignment: valueMatches,
        communicationStyle,
        goalCompatibility,
      },
    }
  } catch (error) {
    console.error('[Compatibility] Error:', error)
    return getEmptyCompatibility()
  }
}

function getEmptyCompatibility(): CompatibilityBreakdown {
  return {
    overall: 0,
    interests: 0,
    lifestyle: 0,
    values: 0,
    communication: 0,
    goals: 0,
    details: {
      interestOverlap: [],
      lifestyleMatch: [],
      valueAlignment: [],
      communicationStyle: 'Unknown',
      goalCompatibility: 'Unknown',
    },
  }
}

