# Comprehensive Bug Fixes & Improvements - AERO Dating App

## Status: In Progress

### ✅ COMPLETED
1. **Bottom Nav - White Icon/Text When Active** (fix-3)
   - Changed active state colors from `text-primary-red` to `text-white` in BottomNav.tsx
   - Makes icons and text visible when selected

2. **App Name Changed from Spark to AERO** (fix-12 - partial)
   - Updated app/feed/page.tsx header from "Spark" to "AERO"
   - Updated app/layout.tsx metadata title

### 🔄 IN PROGRESS

3. **Android Back Button Handler** (fix-4)
   - Need to add Capacitor App plugin
   - Implement back button listener in layout.tsx
   - Handle navigation stack properly

4. **Notifications Panel** (fix-1)
   - ActivityFeed.tsx code looks correct
   - Need to verify data loading and display

5. **Lens/Discovery Button** (fix-2)
   - DiscoveryModes component exists
   - Need to integrate into feed page properly

6. **Appearance & Display Settings** (fix-5)
   - Create /app/settings/appearance/page.tsx
   - Add bottom padding for phone navigation
   - Implement theme, font, animation toggles

7. **Message Read Status** (fix-6)
   - Check if message marking works correctly
   - Ensure BottomNav refreshes after reading messages

8. **Feed Animations** (fix-7)
   - Add smoother transitions between profiles
   - Implement GPU-accelerated animations
   - Reduce frame drops during swiping

9. **Matching Logic** (fix-8)
   - Ensure matched/declined users don't appear in feed
   - Check likes table query in loadFeed function

10. **Boost Functionality** (fix-9)
    - Implement daily limit (3 boosts per day)
    - Add usage tracking in database
    - Make completely free

11. **Super Like & Boost Profile** (fix-10)
    - Update FloatingActionButton with real functionality
    - Super Like: 5 per day limit
    - Boost Profile: 3 per day limit
    - Track usage in database

12. **Remove Main 3 Buttons** (fix-11)
    - ProfileCard uses swipe gestures already
    - Need to check if there are any visible action buttons to remove

13. **Improve All Animations** (fix-13)
    - Add spring physics to all animations
    - Implement micro-interactions
    - Improve performance with will-change CSS
    - Add entrance/exit animations

## Implementation Order
1. Android back button handler (critical for UX)
2. Appearance settings page (requested feature)
3. Boost & Super Like limits (feature completion)
4. Feed animations improvements (performance)
5. Matching logic fix (bug fix)
6. Polish remaining items

## Database Changes Needed
- Add `boost_usage` table (user_id, used_at, type)
- Add `superlike_usage` table (user_id, used_at)
- Add indexes for performance
