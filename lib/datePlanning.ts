// Smart Date Planning - Suggest date ideas based on mutual interests

import { supabase } from './supabase'

interface DateSuggestion {
  title: string
  description: string
  type: 'coffee' | 'dinner' | 'activity' | 'outdoor' | 'cultural' | 'casual'
  location?: string
  duration: string
  cost: 'low' | 'medium' | 'high'
  weatherDependent: boolean
}

export async function generateDateSuggestions(
  userId: string,
  otherUserId: string,
  location?: { city?: string; latitude?: number; longitude?: number }
): Promise<DateSuggestion[]> {
  try {
    // Get both profiles
    const [
      { data: userProfile },
      { data: otherProfile },
    ] = await Promise.all([
      supabase.from('profiles').select('interests, city').eq('id', userId).single(),
      supabase.from('profiles').select('interests, city').eq('id', otherUserId).single(),
    ])

    if (!userProfile || !otherProfile) return []

    const userInterests = Array.isArray(userProfile.interests) ? userProfile.interests : []
    const otherInterests = Array.isArray(otherProfile.interests) ? otherProfile.interests : []
    const commonInterests = userInterests.filter((i: string) => otherInterests.includes(i))
    const allInterests = [...new Set([...userInterests, ...otherInterests])]

    const suggestions: DateSuggestion[] = []
    const city = location?.city || userProfile.city || otherProfile.city || 'your area'

    // Coffee/Tea dates
    if (commonInterests.some(i => i.toLowerCase().includes('coffee')) ||
        allInterests.some(i => i.toLowerCase().includes('coffee'))) {
      suggestions.push({
        title: 'Coffee Shop Date',
        description: `Explore a cozy coffee shop in ${city}. Perfect for getting to know each other over great coffee and conversation.`,
        type: 'coffee',
        location: city,
        duration: '1-2 hours',
        cost: 'low',
        weatherDependent: false,
      })
    }

    // Food/Restaurant dates
    if (commonInterests.some(i => ['Food', 'Cooking', 'Restaurants'].includes(i)) ||
        allInterests.some(i => ['Food', 'Cooking'].includes(i))) {
      suggestions.push({
        title: 'Dinner Date',
        description: `Try a new restaurant in ${city}. Great food and great company - what more could you want?`,
        type: 'dinner',
        location: city,
        duration: '2-3 hours',
        cost: 'medium',
        weatherDependent: false,
      })
    }

    // Art/Cultural dates
    if (commonInterests.some(i => ['Art', 'Museums', 'Culture'].includes(i))) {
      suggestions.push({
        title: 'Museum or Art Gallery',
        description: `Visit a local museum or art gallery. Explore culture together and have meaningful conversations.`,
        type: 'cultural',
        location: city,
        duration: '2-3 hours',
        cost: 'low',
        weatherDependent: false,
      })
    }

    // Outdoor activities
    if (commonInterests.some(i => ['Outdoor Activities', 'Hiking', 'Parks', 'Nature'].includes(i))) {
      suggestions.push({
        title: 'Park Walk or Hike',
        description: `Take a walk in a beautiful park or go for a hike. Nature is the perfect backdrop for getting to know each other.`,
        type: 'outdoor',
        location: city,
        duration: '2-4 hours',
        cost: 'low',
        weatherDependent: true,
      })
    }

    // Fitness/Active dates
    if (commonInterests.some(i => ['Fitness', 'Sports', 'Exercise'].includes(i))) {
      suggestions.push({
        title: 'Active Date',
        description: `Go for a run, bike ride, or try a fitness class together. Stay active while having fun!`,
        type: 'activity',
        location: city,
        duration: '1-2 hours',
        cost: 'low',
        weatherDependent: true,
      })
    }

    // Music/Entertainment
    if (commonInterests.some(i => ['Music', 'Concerts', 'Live Music'].includes(i))) {
      suggestions.push({
        title: 'Live Music or Concert',
        description: `Check out a local live music venue or concert. Share your love of music together.`,
        type: 'cultural',
        location: city,
        duration: '2-4 hours',
        cost: 'medium',
        weatherDependent: false,
      })
    }

    // Generic suggestions
    suggestions.push({
      title: 'Casual Meetup',
      description: `Meet for drinks or a casual meal. Keep it simple and relaxed - perfect for a first date.`,
      type: 'casual',
      location: city,
      duration: '1-2 hours',
      cost: 'low',
      weatherDependent: false,
    })

    // Return top 5 suggestions
    return suggestions.slice(0, 5)
  } catch (error) {
    console.error('[DatePlanning] Error:', error)
    return []
  }
}

