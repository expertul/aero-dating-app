// Smart Photos - Auto-order photos by engagement

import { supabase } from './supabase'

// Calculate engagement score for a photo
export async function calculatePhotoEngagement(mediaId: string): Promise<number> {
  try {
    const { data: media } = await supabase
      .from('profile_media')
      .select('likes_count, views_count')
      .eq('id', mediaId)
      .single()
    
    if (!media) return 0
    
    // Engagement = (likes * 10) + views
    const engagement = (media.likes_count || 0) * 10 + (media.views_count || 0)
    
    return engagement
  } catch (error) {
    return 0
  }
}

// Update photo engagement when profile is viewed
export async function trackPhotoView(mediaId: string): Promise<void> {
  try {
    await supabase.rpc('increment_photo_views', { media_id: mediaId })
  } catch (error) {
    // Fallback: manual update
    const { data: media } = await supabase
      .from('profile_media')
      .select('views_count')
      .eq('id', mediaId)
      .single()
    
    if (media) {
      await supabase
        .from('profile_media')
        .update({ views_count: (media.views_count || 0) + 1 })
        .eq('id', mediaId)
    }
  }
}

// Update photo engagement when profile is liked
export async function trackPhotoLike(userId: string, likedUserId: string): Promise<void> {
  try {
    // Get the first photo (most visible) of the liked profile
    const { data: media } = await supabase
      .from('profile_media')
      .select('id')
      .eq('user_id', likedUserId)
      .order('display_order', { ascending: true })
      .limit(1)
      .single()
    
    if (media) {
      await supabase.rpc('increment_photo_likes', { media_id: media.id })
    }
  } catch (error) {
    // Fallback: manual update
    const { data: media } = await supabase
      .from('profile_media')
      .select('id, likes_count')
      .eq('user_id', likedUserId)
      .order('display_order', { ascending: true })
      .limit(1)
      .single()
    
    if (media) {
      await supabase
        .from('profile_media')
        .update({ likes_count: (media.likes_count || 0) + 1 })
        .eq('id', media.id)
    }
  }
}

// Reorder photos by engagement score
export async function reorderPhotosByEngagement(userId: string): Promise<void> {
  try {
    // Get all photos with engagement scores
    const { data: photos } = await supabase
      .from('profile_media')
      .select('id, engagement_score, likes_count, views_count')
      .eq('user_id', userId)
      .order('engagement_score', { ascending: false })
    
    if (!photos || photos.length === 0) return
    
    // Update display_order based on engagement
    for (let i = 0; i < photos.length; i++) {
      await supabase
        .from('profile_media')
        .update({ display_order: i })
        .eq('id', photos[i].id)
    }
  } catch (error) {
    // Error reordering photos
  }
}

// Update engagement score for a photo
export async function updatePhotoEngagementScore(mediaId: string): Promise<void> {
  try {
    const { data: media } = await supabase
      .from('profile_media')
      .select('likes_count, views_count')
      .eq('id', mediaId)
      .single()
    
    if (media) {
      const engagementScore = (media.likes_count || 0) * 10 + (media.views_count || 0)
      
      await supabase
        .from('profile_media')
        .update({ engagement_score: engagementScore })
        .eq('id', mediaId)
    }
  } catch (error) {
    // Error updating engagement
  }
}

