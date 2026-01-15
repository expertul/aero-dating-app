// Profile utility functions

import { supabase } from './supabase'

// Track profile view
export async function trackProfileView(viewedUserId: string, viewerUserId: string) {
  if (viewedUserId === viewerUserId) return
  
  try {
    await supabase
      .from('profile_views')
      .upsert({
        viewer_id: viewerUserId,
        viewed_id: viewedUserId,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'viewer_id,viewed_id'
      })
  } catch (error) {
    // Error tracking view
  }
}

// Update user activity status
export async function updateUserActivity() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({
        last_active: new Date().toISOString(),
        is_online: true
      })
      .eq('id', user.id)

    // Set offline after 5 minutes of inactivity
    setTimeout(async () => {
      await supabase
        .from('profiles')
        .update({ is_online: false })
        .eq('id', user.id)
    }, 5 * 60 * 1000)
  } catch (error) {
    // Error updating activity
  }
}

// Calculate profile strength (0-100)
export async function calculateProfileStrength(userId: string): Promise<number> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        media:profile_media(*)
      `)
      .eq('id', userId)
      .single()

    if (!profile) return 0

    let strength = 0
    const photoCount = profile.media?.length || 0

    // Photos (40 points)
    if (photoCount > 0) strength += 30
    if (photoCount >= 3) strength += 10

    // Bio (20 points)
    if (profile.bio && profile.bio.trim().length > 20) strength += 20

    // Interests (15 points)
    if (profile.interests && profile.interests.length > 0) strength += 15

    // Location (10 points)
    if (profile.location || (profile.latitude && profile.longitude)) strength += 10

    // Verification (15 points)
    if (profile.verified) strength += 15

    return Math.min(strength, 100)
  } catch (error) {
    return 0
  }
}

// Get profile views count
export async function getProfileViewsCount(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('profile_views_count')
      .eq('id', userId)
      .single()

    return data?.profile_views_count || 0
  } catch (error) {
    return 0
  }
}

// Check if user is online
export function isUserOnline(lastActive: string | null): boolean {
  if (!lastActive) return false
  const lastActiveDate = new Date(lastActive)
  const now = new Date()
  const diffInMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60)
  return diffInMinutes < 5
}

// Get time ago string
export function getTimeAgo(timestamp: string | null): string {
  if (!timestamp) return 'never'
  
  const now = new Date()
  const time = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return `${Math.floor(diffInSeconds / 604800)}w ago`
}

