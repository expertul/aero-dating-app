# 🚀 Test Bots Right Now!

## Quick Steps

### 1. Make Sure Service Role Key is Set

Add to `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Create the Bots

Open in browser:
```
http://localhost:3000/admin/bots
```

Click **"Initialize Bots"** button.

You should see:
- ✅ Emma - Created successfully
- ✅ Alex - Created successfully  
- ✅ Sophia - Created successfully
- ✅ James - Created successfully
- ✅ Luna - Created successfully

### 4. Find Bots in Feed

1. Go to `/feed`
2. Bots will appear naturally mixed with other profiles
3. They look like regular users!

### 5. Match with a Bot

1. **Swipe right** (heart) on a bot
2. If bot likes you back → **Match!** 🎉
3. Go to **Matches** page
4. Click on the bot to chat

### 6. Chat with Bot

1. **Send a message** like "Hi!"
2. **Wait 1-13 minutes** (depending on bot personality)
3. **Bot responds intelligently!**

## Bot Response Times

- **James** (Fitness): 1-3 minutes ⚡
- **Emma** (Traveler): 1-4 minutes ✈️
- **Alex** (Tech): 2-7 minutes 💻
- **Sophia** (Creative): 2-12 minutes 🎨
- **Luna** (Bookworm): 3-13 minutes 📚

## Test Different Conversations

Try these with different bots:

**With Emma (Traveler):**
- "I love traveling!"
- "Have you been to Japan?"
- "What's your favorite place?"

**With Alex (Tech):**
- "Do you code?"
- "What tech are you into?"
- "Working on any projects?"

**With Sophia (Creative):**
- "I love art!"
- "What kind of music do you like?"
- "Are you creative?"

**With James (Fitness):**
- "Do you work out?"
- "What's your favorite exercise?"
- "How do you stay fit?"

**With Luna (Bookworm):**
- "What are you reading?"
- "I love books too!"
- "Any book recommendations?"

## How It Works

1. **You send message** → Stored in database
2. **Bot service detects** → Bot needs to respond
3. **Smart response generated** → Based on personality & context
4. **Message scheduled** → With realistic delay
5. **Queue processor runs** → Every 2 minutes
6. **Bot responds!** → Appears in chat

## Troubleshooting

**Bots not appearing?**
- Check `/admin/bots` - were they created?
- Check feed filters (age, gender, distance)
- Bots are always visible now (for testing)

**Bots not responding?**
- Wait 2-3 minutes (queue processes every 2 min)
- Check browser console for errors
- Verify bot queue processor is running

**Want to see bot responses faster?**
- Refresh the chat page
- Or manually call `/api/bot-process`

---

**Ready!** Go to `/admin/bots` and create your bots now! 🎉

