# Environment Variables Check

## Required Environment Variables

Based on the codebase analysis, your `.env.local` file should contain:

### ✅ **REQUIRED** (Must be present):

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Used in: `lib/supabase.ts`, `app/api/bot-respond/route.ts`, `app/api/bot-process/route.ts`
   - Example: `https://xxxxx.supabase.co`
   - **Status**: ✅ Required for all Supabase operations

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Used in: `lib/supabase.ts`
   - **Status**: ✅ Required for client-side Supabase operations

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Used in: `app/api/bot-respond/route.ts`, `app/api/bot-process/route.ts`, `app/api/bot-like-back/route.ts`
   - **Status**: ✅ **CRITICAL** - Required for bot operations (server-side only)
   - **Note**: This key bypasses RLS and allows bots to send messages

### ⚠️ **OPTIONAL** (Recommended for better bot responses):

4. **GROQ_API_KEY** or **NEXT_PUBLIC_GROQ_API_KEY**
   - Used in: `lib/smartBotResponses.ts`
   - **Status**: ⚠️ Optional - Enables AI-powered bot responses
   - **Fallback**: If not set, bots use rule-based responses (still works)
   - **Note**: Free tier available at groq.com

5. **HUGGING_FACE_API_KEY**
   - Used in: `lib/smartBotResponses.ts`
   - **Status**: ⚠️ Optional - Alternative AI API
   - **Fallback**: If not set, uses Groq or rule-based

## How to Verify Your .env.local

1. Check if file exists: `.env.local` in project root
2. Verify all required variables are present
3. Make sure there are no typos in variable names
4. Ensure values don't have extra spaces or quotes

## Quick Test

Run this to check if variables are loaded (in development):
```bash
npm run dev
```

Check console for any "undefined" or "missing" errors related to environment variables.

