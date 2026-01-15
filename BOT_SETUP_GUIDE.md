# 🤖 Bot Setup Guide - Create & Test Bots

## Quick Setup

### Step 1: Initialize Bots

1. **Make sure you have `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local`**:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

2. **Start your dev server**:
   ```bash
   npm run dev
   ```

3. **Open the bot admin page**:
   ```
   http://localhost:3000/admin/bots
   ```

4. **Click "Initialize Bots"** - This will create all 5 bots:
   - ✅ Emma (Traveler, London)
   - ✅ Alex (Tech, Manchester)
   - ✅ Sophia (Creative, Brighton)
   - ✅ James (Fitness, Edinburgh)
   - ✅ Luna (Bookworm, Oxford)

### Step 2: Find Bots in Feed

1. **Go to your feed** (`/feed`)
2. **Bots will appear naturally** mixed with other profiles
3. **Swipe on them** like regular users
4. **Match with them** by liking them

### Step 3: Chat with Bots

1. **After matching**, go to **Matches** page
2. **Click on a bot** to start chatting
3. **Send a message** - bots respond intelligently!
4. **Bots respond with realistic delays** (1-13 minutes based on personality)

## Bot Personalities

### 🌍 Emma - The Traveler
- **Location**: London
- **Age**: 28
- **Personality**: Adventurous, enthusiastic
- **Response Time**: 1-4 minutes
- **Interests**: Travel, Photography, Food, Languages, Coffee

### 💻 Alex - The Tech Enthusiast
- **Location**: Manchester
- **Age**: 26
- **Personality**: Tech-focused, innovative
- **Response Time**: 2-7 minutes
- **Interests**: Technology, Gaming, Startups, Podcasts, Innovation

### 🎨 Sophia - The Creative Artist
- **Location**: Brighton
- **Age**: 24
- **Personality**: Artistic, expressive
- **Response Time**: 2-12 minutes
- **Interests**: Art, Music, Writing, Film, Poetry

### 💪 James - The Fitness Enthusiast
- **Location**: Edinburgh
- **Age**: 29
- **Personality**: Energetic, motivational
- **Response Time**: 1-3 minutes
- **Interests**: Fitness, Nutrition, Sports, Outdoor Activities, Health

### 📚 Luna - The Bookworm
- **Location**: Oxford
- **Age**: 27
- **Personality**: Intellectual, thoughtful
- **Response Time**: 3-13 minutes
- **Interests**: Books, Philosophy, Psychology, Deep Conversations, Coffee

## How Bots Work

### Smart Responses
- **No API Required**: Uses intelligent rule-based system
- **Context-Aware**: Understands conversation history
- **Personality-Consistent**: Each bot maintains their character
- **Natural Conversations**: Asks questions, shares stories

### Response System
1. **Analyzes your message** (intent, topics, sentiment)
2. **Generates appropriate response** based on personality
3. **Schedules response** with realistic delay
4. **Sends message** through queue system

### Testing Tips

1. **Try different conversation styles**:
   - Ask questions
   - Share stories
   - Give compliments
   - Discuss topics they like

2. **Test response times**:
   - James responds fastest (1-3 min)
   - Luna takes longest (3-13 min)

3. **Test personality consistency**:
   - Emma talks about travel
   - Alex discusses tech
   - Sophia is artistic
   - James is fitness-focused
   - Luna is intellectual

## Troubleshooting

### Bots not appearing in feed?
- Check that bots were created successfully
- Make sure `shouldShowBots()` returns `true`
- Check feed filters (age, distance, gender)

### Bots not responding?
- Check bot queue processor is running
- Verify bot message queue in database
- Check bot service functions

### Want to reset bots?
- Delete bot profiles from database
- Re-run initialization
- Or manually delete via Supabase dashboard

## Next Steps

After testing:
1. **Adjust bot visibility** in `lib/aiBots.ts` - `shouldShowBots()`
2. **Customize responses** in `lib/smartBotResponses.ts`
3. **Add bot photos** via Supabase Storage
4. **Set up bot queue processor** (cron job) for production

---

**Ready to test!** Go to `/admin/bots` and create your bots! 🚀

