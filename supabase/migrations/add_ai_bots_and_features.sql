-- ============================================
-- AI BOTS AND NEW FEATURES MIGRATION
-- Safe and secure implementation
-- ============================================

-- ============================================
-- EXTEND PROFILES TABLE FOR BOTS
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bot_personality TEXT,
ADD COLUMN IF NOT EXISTS bot_ai_provider TEXT,
ADD COLUMN IF NOT EXISTS incognito_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS passport_location TEXT,
ADD COLUMN IF NOT EXISTS passport_expires_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- PROMPTS/QUESTIONS TABLE (Hinge-style)
-- ============================================
CREATE TABLE IF NOT EXISTS profile_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_profile_prompts_user_id ON profile_prompts(user_id);

ALTER TABLE profile_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all prompts"
  ON profile_prompts FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own prompts"
  ON profile_prompts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- VOICE PROMPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL, -- seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_prompts_user_id ON voice_prompts(user_id);

ALTER TABLE voice_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all voice prompts"
  ON voice_prompts FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own voice prompts"
  ON voice_prompts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- VIDEO PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL, -- seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_video_profiles_user_id ON video_profiles(user_id);

ALTER TABLE video_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all video profiles"
  ON video_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own video profile"
  ON video_profiles FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- EXTEND PROFILE MEDIA FOR SMART PHOTOS
-- ============================================
ALTER TABLE profile_media
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- ============================================
-- BOT CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  conversation_context JSONB DEFAULT '{}'::jsonb,
  last_bot_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bot_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bot_conversations_bot_id ON bot_conversations(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_conversations_user_id ON bot_conversations(user_id);

ALTER TABLE bot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bot conversations"
  ON bot_conversations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = bot_id);

-- ============================================
-- BOT MESSAGE QUEUE (for delayed responses)
-- ============================================
CREATE TABLE IF NOT EXISTS bot_message_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  message_body TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'photo', 'reaction')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_message_queue_scheduled ON bot_message_queue(scheduled_at) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bot_message_queue_bot_user ON bot_message_queue(bot_id, user_id);

ALTER TABLE bot_message_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bots can manage own message queue"
  ON bot_message_queue FOR ALL
  USING (auth.uid() = bot_id);

-- ============================================
-- EXTEND MESSAGES FOR READ RECEIPTS
-- ============================================
-- Already has read_at column, but let's ensure it's there
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- STORIES TABLE (already exists, but ensure it's correct)
-- ============================================
-- Stories table already created in previous migration

-- ============================================
-- STORY VIEWS TABLE (already exists)
-- ============================================
-- Story views table already created

-- ============================================
-- VIDEO CALLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'ended', 'missed')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_calls_match_id ON video_calls(match_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_caller ON video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_receiver ON video_calls(receiver_id);

ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video calls"
  ON video_calls FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create video calls"
  ON video_calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update own video calls"
  ON video_calls FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- ============================================
-- EXTEND PREFERENCES FOR ADVANCED FILTERS
-- ============================================
ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS height_min INTEGER,
ADD COLUMN IF NOT EXISTS height_max INTEGER,
ADD COLUMN IF NOT EXISTS education_preferences TEXT[],
ADD COLUMN IF NOT EXISTS job_preferences TEXT[],
ADD COLUMN IF NOT EXISTS dealbreakers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS incognito_mode BOOLEAN DEFAULT FALSE;

-- ============================================
-- DAILY LIMITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_limits (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  likes_sent INTEGER DEFAULT 0,
  superlikes_sent INTEGER DEFAULT 0,
  matches_viewed INTEGER DEFAULT 0,
  resets_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_limits_date ON daily_limits(date);

ALTER TABLE daily_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily limits"
  ON daily_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own daily limits"
  ON daily_limits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert daily limits"
  ON daily_limits FOR INSERT
  WITH CHECK (true);

-- ============================================
-- "WE MET" FEEDBACK TABLE (Hinge-style)
-- ============================================
CREATE TABLE IF NOT EXISTS we_met_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  met_in_person BOOLEAN NOT NULL,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_we_met_feedback_match_id ON we_met_feedback(match_id);

ALTER TABLE we_met_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON we_met_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON we_met_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS FOR BOTS
-- ============================================

-- Function to get bot response delay (human-like timing)
CREATE OR REPLACE FUNCTION get_bot_response_delay(bot_personality TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Return delay in seconds based on personality
  CASE bot_personality
    WHEN 'fitness' THEN RETURN floor(random() * 120 + 60)::INTEGER; -- 1-3 minutes
    WHEN 'tech' THEN RETURN floor(random() * 300 + 120)::INTEGER; -- 2-7 minutes
    WHEN 'creative' THEN RETURN floor(random() * 600 + 120)::INTEGER; -- 2-12 minutes
    WHEN 'bookworm' THEN RETURN floor(random() * 600 + 180)::INTEGER; -- 3-13 minutes
    WHEN 'traveler' THEN RETURN floor(random() * 180 + 60)::INTEGER; -- 1-4 minutes
    ELSE RETURN floor(random() * 300 + 120)::INTEGER; -- Default 2-7 minutes
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to reset daily limits
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE daily_limits
  SET 
    likes_sent = 0,
    superlikes_sent = 0,
    matches_viewed = 0,
    resets_at = CURRENT_DATE + INTERVAL '1 day',
    date = CURRENT_DATE
  WHERE date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_is_bot ON profiles(is_bot) WHERE is_bot = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_incognito ON profiles(incognito_mode) WHERE incognito_mode = TRUE;
CREATE INDEX IF NOT EXISTS idx_profile_media_engagement ON profile_media(engagement_score DESC);

-- ============================================
-- SAFETY: RLS POLICIES FOR BOTS
-- ============================================
-- Bots follow same RLS policies as regular users
-- They can only interact within their permissions
-- Bot identification is internal only (is_bot flag)

