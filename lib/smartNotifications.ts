// Smart Notification Timing
// Learn user activity patterns and send notifications at optimal times

import { supabase } from './supabase'

// Track user activity
export async function trackUserActivity(userId: string) {
  try {
    const currentHour = new Date().getHours()

    // Update last active hour
    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        last_active_hour: currentHour,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    // Update profile last active
    await supabase
      .from('profiles')
      .update({
        last_active: new Date().toISOString(),
        is_online: true
      })
      .eq('id', userId)
  } catch (error) {
    console.error('[SmartNotifications] Error tracking activity:', error)
  }
}

// Get optimal notification time for user
export async function getOptimalNotificationTime(userId: string): Promise<number[]> {
  try {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('preferred_notification_times, last_active_hour, quiet_hours_start, quiet_hours_end')
      .eq('user_id', userId)
      .single()

    if (prefs?.preferred_notification_times && prefs.preferred_notification_times.length > 0) {
      return prefs.preferred_notification_times
    }

    // Learn from last active hour
    if (prefs?.last_active_hour !== null && prefs?.last_active_hour !== undefined) {
      const lastActive = prefs.last_active_hour
      // Suggest times around when user is active
      return [
        lastActive - 1 >= 0 ? lastActive - 1 : 23,
        lastActive,
        (lastActive + 1) % 24
      ]
    }

    // Default: evening hours (6-9 PM)
    return [18, 19, 20, 21]
  } catch (error) {
    console.error('[SmartNotifications] Error getting optimal time:', error)
    return [18, 19, 20, 21] // Default evening hours
  }
}

// Check if it's a good time to send notification
export async function shouldSendNotification(userId: string): Promise<boolean> {
  try {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('quiet_hours_start, quiet_hours_end, preferred_notification_times')
      .eq('user_id', userId)
      .single()

    const currentHour = new Date().getHours()

    // Check quiet hours
    if (prefs) {
      const quietStart = prefs.quiet_hours_start || 22
      const quietEnd = prefs.quiet_hours_end || 8

      if (quietStart > quietEnd) {
        // Quiet hours span midnight (e.g., 22-8)
        if (currentHour >= quietStart || currentHour < quietEnd) {
          return false
        }
      } else {
        // Quiet hours within same day
        if (currentHour >= quietStart && currentHour < quietEnd) {
          return false
        }
      }

      // Check preferred times
      if (prefs.preferred_notification_times && prefs.preferred_notification_times.length > 0) {
        return prefs.preferred_notification_times.includes(currentHour)
      }
    }

    return true
  } catch (error) {
    console.error('[SmartNotifications] Error checking notification time:', error)
    return true // Default: allow notifications
  }
}

// Update preferred notification times based on activity
export async function updateNotificationPreferences(userId: string, activeHours: number[]) {
  try {
    // Calculate most common active hours
    const hourCounts: Record<number, number> = {}
    activeHours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    const preferredTimes = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([hour]) => parseInt(hour))

    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        preferred_notification_times: preferredTimes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
  } catch (error) {
    console.error('[SmartNotifications] Error updating preferences:', error)
  }
}

