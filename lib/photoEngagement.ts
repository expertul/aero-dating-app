// AI-Powered Photo Ranking & Optimization
// Track photo engagement and suggest best photo order

import { supabase } from './supabase'

interface PhotoEngagement {
  photoId: string
  views: number
  likes: number
  matches: number
  engagementRate: number
  rank: number
}

// Track when a photo gets a like
export async function trackPhotoLike(viewerId: string, profileId: string, photoIndex: number) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('media:profile_media(*)')
      .eq('id', profileId)
      .single()

    if (!profile?.media || !profile.media[photoIndex]) return

    const photo = profile.media[photoIndex]

    // Track engagement
    await supabase
      .from('photo_engagement')
      .upsert({
        photo_id: photo.id,
        profile_id: profileId,
        viewer_id: viewerId,
        engagement_type: 'like',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'photo_id,viewer_id,engagement_type'
      })
  } catch (error) {
    console.error('[PhotoEngagement] Error tracking like:', error)
  }
}

// Track photo view
export async function trackPhotoView(profileId: string, photoIndex: number, viewerId: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('media:profile_media(*)')
      .eq('id', profileId)
      .single()

    if (!profile?.media || !profile.media[photoIndex]) return

    const photo = profile.media[photoIndex]

    await supabase
      .from('photo_engagement')
      .upsert({
        photo_id: photo.id,
        profile_id: profileId,
        viewer_id: viewerId,
        engagement_type: 'view',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'photo_id,viewer_id,engagement_type'
      })
  } catch (error) {
    console.error('[PhotoEngagement] Error tracking view:', error)
  }
}

// Get photo engagement stats
export async function getPhotoEngagement(profileId: string): Promise<PhotoEngagement[]> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('media:profile_media(*)')
      .eq('id', profileId)
      .single()

    if (!profile?.media) return []

    const photoIds = profile.media.map((m: any) => m.id)

    // Get engagement stats
    const { data: engagements } = await supabase
      .from('photo_engagement')
      .select('photo_id, engagement_type')
      .in('photo_id', photoIds)

    // Calculate stats per photo
    const stats: Record<string, PhotoEngagement> = {}

    profile.media.forEach((photo: any) => {
      stats[photo.id] = {
        photoId: photo.id,
        views: 0,
        likes: 0,
        matches: 0,
        engagementRate: 0,
        rank: 0
      }
    })

    engagements?.forEach((eng: any) => {
      if (stats[eng.photo_id]) {
        if (eng.engagement_type === 'view') {
          stats[eng.photo_id].views++
        } else if (eng.engagement_type === 'like') {
          stats[eng.photo_id].likes++
        } else if (eng.engagement_type === 'match') {
          stats[eng.photo_id].matches++
        }
      }
    })

    // Calculate engagement rate
    Object.values(stats).forEach(stat => {
      stat.engagementRate = stat.views > 0 ? (stat.likes / stat.views) * 100 : 0
    })

    // Rank photos by engagement
    const ranked = Object.values(stats).sort((a, b) => {
      // Primary: engagement rate
      if (b.engagementRate !== a.engagementRate) {
        return b.engagementRate - a.engagementRate
      }
      // Secondary: total likes
      return b.likes - a.likes
    })

    ranked.forEach((stat, index) => {
      stat.rank = index + 1
    })

    return ranked
  } catch (error) {
    console.error('[PhotoEngagement] Error getting stats:', error)
    return []
  }
}

// Get suggested photo order (best performing first)
export async function getSuggestedPhotoOrder(profileId: string): Promise<string[]> {
  const engagement = await getPhotoEngagement(profileId)
  return engagement
    .sort((a, b) => a.rank - b.rank)
    .map(e => e.photoId)
}

