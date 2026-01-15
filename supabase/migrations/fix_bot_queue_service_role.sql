-- Fix RLS for bot_message_queue to allow service role full access
-- Service role should bypass RLS, but we'll add explicit policies as backup

-- First, ensure RLS is enabled
ALTER TABLE bot_message_queue ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on bot_message_queue
DROP POLICY IF EXISTS "Bots can manage own message queue" ON bot_message_queue;
DROP POLICY IF EXISTS "Bots and service can manage message queue" ON bot_message_queue;
DROP POLICY IF EXISTS "Service role can process bot queue" ON bot_message_queue;
DROP POLICY IF EXISTS "Service role can update bot queue" ON bot_message_queue;
DROP POLICY IF EXISTS "Service role can manage bot message queue" ON bot_message_queue;

-- Create a policy that allows service role to do everything
-- Using auth.role() which checks the actual role
CREATE POLICY "Service role full access to bot_message_queue"
  ON bot_message_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also allow authenticated users (bots) to manage their own queue entries
CREATE POLICY "Bots can manage own queue entries"
  ON bot_message_queue
  FOR ALL
  TO authenticated
  USING (auth.uid() = bot_id)
  WITH CHECK (auth.uid() = bot_id);

-- Grant necessary permissions to service_role
GRANT ALL ON bot_message_queue TO service_role;

