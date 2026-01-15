# Fix Bot Queue RLS Permission Error

## Problem
The `/api/bot-process` route is getting permission denied errors:
```
permission denied for table bot_message_queue
```

## Solution
Run the migration to grant service role access to `bot_message_queue`.

## Steps to Fix

### Option 1: Run Migration in Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/fix_bot_queue_service_role.sql`
4. Click **Run** to execute the migration

### Option 2: Run Migration via Supabase CLI

If you have Supabase CLI installed:
```bash
supabase db push
```

### Option 3: Manual SQL Fix

Run this SQL directly in Supabase SQL Editor:

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Bots can manage own message queue" ON bot_message_queue;
DROP POLICY IF EXISTS "Bots and service can manage message queue" ON bot_message_queue;
DROP POLICY IF EXISTS "Service role can process bot queue" ON bot_message_queue;
DROP POLICY IF EXISTS "Service role can update bot queue" ON bot_message_queue;
DROP POLICY IF EXISTS "Service role can manage bot message queue" ON bot_message_queue;

-- Create policy that allows service role full access
CREATE POLICY "Service role full access to bot_message_queue"
  ON bot_message_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users (bots) to manage their own queue entries
CREATE POLICY "Bots can manage own queue entries"
  ON bot_message_queue
  FOR ALL
  TO authenticated
  USING (auth.uid() = bot_id)
  WITH CHECK (auth.uid() = bot_id);

-- Grant permissions
GRANT ALL ON bot_message_queue TO service_role;
```

## Verify Fix

After running the migration, check that the error is gone:
1. Restart your dev server: `npm run dev`
2. Check the console - you should see:
   ```
   [Bot] Processing queue at: ...
   [Bot] No messages ready to send
   ```
   (No more permission errors!)

## Note

The `/api/bot-process` route is called by `BotQueueProcessor` component to process scheduled bot messages. However, since we're now using `/api/bot-respond` which sends messages directly, the queue processor might not be needed. But it's good to have it working in case we need it in the future.

