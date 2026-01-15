-- Fix RLS policy for bot_message_queue to allow service role access
-- This allows the API route to process bot messages

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Bots can manage own message queue" ON bot_message_queue;

-- Create new policy that allows:
-- 1. Bots to manage their own queue entries
-- 2. Service role to process all queue entries (for API route)
CREATE POLICY "Bots and service can manage message queue"
  ON bot_message_queue FOR ALL
  USING (
    auth.uid() = bot_id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Also allow service role to read and update
CREATE POLICY "Service role can process bot queue"
  ON bot_message_queue FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can update bot queue"
  ON bot_message_queue FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

