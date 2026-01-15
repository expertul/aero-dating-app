# Bot Debugging Guide

## Quick Check List

### 1. Check Environment Variables
Open `.env.local` and verify:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` is set
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is set (CRITICAL for bots)
- ⚠️ `GROQ_API_KEY` is optional (for AI responses)

### 2. Check Bot Profile
1. Go to `/admin/bots` in your app
2. Click "Initialize Bots" if you haven't already
3. Verify bots are created in database:
   - Go to Supabase Dashboard → Table Editor → `profiles`
   - Filter by `is_bot = true`
   - Should see: Emma, Alex, Sophia, James, Luna

### 3. Check Browser Console
When you send a message to a bot, you should see these logs:

**Expected Console Logs:**
```
[Chat] Checking if user is bot: { otherProfileId: "...", otherProfileName: "James", isBot: true }
[Bot] Handling message to bot: { botId: "...", userId: "...", matchId: "...", userMessage: "hi" }
[Bot] Bot response scheduled: { success: true, message: "Bot response scheduled", delay: 1500 }
```

**Server Logs (Terminal where `npm run dev` is running):**
```
[Bot API] Handling message to bot: { botId: "...", userId: "...", matchId: "...", userMessage: "hi" }
[Bot API] Bot profile found: James fitness
[Bot API] Generating response for personality: James
[Bot API] Generated response: Hey! How's it going? 💪
[Bot API] Sending message with delay: 1500 ms
[Bot API] Typing channel subscribed
[Bot API] Typing indicator shown
[Bot API] Attempting to send message...
[Bot API] Message sent successfully: <message-id>
[Bot API] Typing indicator hidden
```

### 4. Common Issues & Fixes

#### Issue: No logs appear in console
**Possible causes:**
- Bot detection is failing
- `isBot()` function is returning `false`
- Bot profile doesn't have `is_bot = true`

**Fix:**
1. Check browser console for `[Chat] Checking if user is bot:` log
2. If `isBot: false`, check the bot profile in database
3. Verify `is_bot` column is `true` for the bot profile

#### Issue: "Service role key not configured"
**Fix:**
- Add `SUPABASE_SERVICE_ROLE_KEY=your-key-here` to `.env.local`
- Restart dev server: `npm run dev`

#### Issue: "Bot profile not found"
**Fix:**
1. Go to `/admin/bots`
2. Click "Initialize Bots"
3. Verify bot exists in database with `is_bot = true`

#### Issue: Bot responds but message doesn't appear
**Possible causes:**
- Real-time subscription not working
- Message inserted but not syncing

**Fix:**
1. Check Supabase Dashboard → Database → Replication
2. Ensure `messages` table has replication enabled
3. Check browser console for real-time errors

#### Issue: Typing indicator not showing
**Possible causes:**
- Presence channel not subscribed
- Presence polling not working

**Fix:**
- Check browser console for presence errors
- Verify typing channel is set up in chat page

### 5. Manual Test

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Send a message to a bot** (e.g., "hi")
4. **Watch for logs:**
   - Should see `[Chat] Checking if user is bot:`
   - Should see `[Bot] Handling message to bot:`
   - Should see `[Bot] Bot response scheduled:`
5. **Check Network tab:**
   - Look for POST request to `/api/bot-respond`
   - Should return `200 OK` with `{ success: true }`
6. **Wait 1-3 seconds** for bot response
7. **Check Messages table** in Supabase:
   - Should see new message from bot
   - `sender_id` should be bot's ID
   - `body` should contain bot's response

### 6. Verify Bot Response API

Test the API directly:

```bash
curl -X POST http://localhost:3000/api/bot-respond \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "YOUR_BOT_ID",
    "userId": "YOUR_USER_ID",
    "matchId": "YOUR_MATCH_ID",
    "userMessage": "hi"
  }'
```

Should return:
```json
{
  "success": true,
  "message": "Bot response scheduled",
  "delay": 1500,
  "botResponse": "Hey! How's it going? 💪..."
}
```

### 7. Check Database

**Verify bot exists:**
```sql
SELECT id, name, is_bot, bot_personality 
FROM profiles 
WHERE is_bot = true;
```

**Check if message was sent:**
```sql
SELECT * 
FROM messages 
WHERE match_id = 'YOUR_MATCH_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Check bot conversations:**
```sql
SELECT * 
FROM bot_conversations 
WHERE bot_id = 'YOUR_BOT_ID' 
AND user_id = 'YOUR_USER_ID';
```

## Still Not Working?

1. **Check all logs** (browser console + server terminal)
2. **Verify environment variables** are set correctly
3. **Restart dev server** after changing `.env.local`
4. **Check Supabase Dashboard** for any errors
5. **Verify RLS policies** allow service role to insert messages
6. **Check if Realtime is enabled** for `messages` table

