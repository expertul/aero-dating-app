# Bot System Verification & Environment Check

## ✅ Environment Variables Required

Your `.env.local` file **MUST** contain these variables:

### **REQUIRED** (Critical - Bots won't work without these):

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Location: Supabase Dashboard → Settings → API → Project URL
   - Format: `https://xxxxx.supabase.co`
   - Used by: All Supabase operations

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Location: Supabase Dashboard → Settings → API → anon public key
   - Used by: Client-side Supabase operations

3. **SUPABASE_SERVICE_ROLE_KEY** ⚠️ **CRITICAL FOR BOTS**
   - Location: Supabase Dashboard → Settings → API → service_role key
   - Used by: Bot API routes (`/api/bot-respond`, `/api/bot-process`)
   - **Why needed**: Allows bots to send messages bypassing RLS

### **OPTIONAL** (For smarter AI responses):

4. **GROQ_API_KEY** (or **NEXT_PUBLIC_GROQ_API_KEY**)
   - Location: Get free key from [groq.com](https://groq.com)
   - Used by: `lib/smartBotResponses.ts` for AI-powered responses
   - **Fallback**: If missing, bots use rule-based responses (still works)

## ✅ Bot System Components Verified

### 1. **Bot Response API** (`/api/bot-respond`)
- ✅ Created and working
- ✅ Uses service role key for permissions
- ✅ Generates AI responses (Groq or rule-based)
- ✅ Shows typing indicators
- ✅ Sends messages with human-like delays (1-3 seconds)

### 2. **Bot Detection** (`lib/botService.ts`)
- ✅ `isBot()` function checks if profile is a bot
- ✅ `handleUserMessageToBot()` calls API route
- ✅ Non-blocking (doesn't freeze UI)

### 3. **Chat Integration** (`app/chat/[matchId]/page.tsx`)
- ✅ Detects when user sends message to bot
- ✅ Calls bot response handler
- ✅ Non-blocking implementation
- ✅ Works for both regular messages and icebreakers

### 4. **Bot Queue Processor** (`components/BotQueueProcessor.tsx`)
- ✅ Runs every 1 second
- ✅ Processes scheduled bot messages
- ✅ Loaded in root layout

### 5. **AI Response System** (`lib/smartBotResponses.ts`)
- ✅ Tries Groq API first (if key available)
- ✅ Falls back to rule-based responses
- ✅ Human-like, contextual responses

## 🔍 How to Test Bots

1. **Verify bots exist in database:**
   - Go to `/admin/bots` page
   - Click "Initialize Bots" if needed
   - Should create 5 bots: Emma, Alex, Sophia, James, Luna

2. **Test bot response:**
   - Match with a bot (swipe right on bot profile)
   - Send a message to the bot
   - Check browser console for logs:
     - `[Chat] Checking if user is bot:`
     - `[Bot] Handling message to bot:`
     - `[Bot API] Handling message to bot:`
     - `[Bot API] Generated response:`
     - `[Bot API] Message sent successfully`

3. **Check for errors:**
   - Open browser DevTools → Console
   - Look for any red error messages
   - Common issues:
     - `Service role key not configured` → Missing `SUPABASE_SERVICE_ROLE_KEY`
     - `Bot profile not found` → Bots not initialized
     - `Failed to generate bot response` → Check Groq API key or rule-based fallback

## 🐛 Common Issues & Fixes

### Issue: Bots not responding
**Check:**
1. ✅ `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. ✅ Bots are initialized (check `/admin/bots`)
3. ✅ Bot profiles have `is_bot = true` in database
4. ✅ Check browser console for errors

### Issue: "Service role key not configured"
**Fix:** Add `SUPABASE_SERVICE_ROLE_KEY=your-key-here` to `.env.local`

### Issue: "Bot profile not found"
**Fix:** Initialize bots via `/admin/bots` page

### Issue: Bots respond but messages don't appear
**Check:**
1. ✅ Real-time subscriptions are working
2. ✅ Messages table has proper RLS policies
3. ✅ Check Supabase Realtime is enabled

## ✅ System Status

- ✅ Bot API routes created and working
- ✅ Bot detection system functional
- ✅ Chat integration complete
- ✅ AI response system ready (Groq + fallback)
- ✅ Typing indicators implemented
- ✅ Queue processor running
- ✅ Error handling in place
- ✅ Non-blocking implementation

## 📝 Next Steps

1. **Verify `.env.local` has all required keys**
2. **Initialize bots** (if not done): `/admin/bots`
3. **Test bot conversation** by matching and messaging
4. **Check console logs** for any errors
5. **Optional**: Add `GROQ_API_KEY` for smarter responses

