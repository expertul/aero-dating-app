-- ============================================
-- COMPREHENSIVE FEATURES MIGRATION
-- Adds all new features: views, boosts, rewinds, extended profile, etc.
-- ============================================

-- ============================================
-- EXTEND PROFILES TABLE
-- ============================================

-- Add extended profile fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS job TEXT,
ADD COLUMN IF NOT EXISTS relationship_type TEXT[],
ADD COLUMN IF NOT EXISTS drinking TEXT CHECK (drinking IN ('never', 'socially', 'often', 'prefer not to say')),
ADD COLUMN IF NOT EXISTS smoking TEXT CHECK (smoking IN ('never', 'sometimes', 'regularly', 'prefer not to say')),
ADD COLUMN IF NOT EXISTS exercise TEXT CHECK (exercise IN ('never', 'sometimes', 'regularly', 'daily')),
ADD COLUMN IF NOT EXISTS pets TEXT[],
ADD COLUMN IF NOT EXISTS languages TEXT[],
ADD COLUMN IF NOT EXISTS zodiac TEXT,
ADD COLUMN IF NOT EXISTS political_views TEXT CHECK (political_views IN ('liberal', 'moderate', 'conservative', 'other', 'prefer not to say')),
ADD COLUMN IF NOT EXISTS religious_views TEXT CHECK (religious_views IN ('atheist', 'agnostic', 'spiritual', 'religious', 'other', 'prefer not to say')),
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_strength INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS photo_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_received_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS matches_count INTEGER DEFAULT 0;

-- ============================================
-- PROFILE VIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON profile_views(created_at DESC);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile views"
  ON profile_views FOR SELECT
  USING (auth.uid() = viewed_id);

CREATE POLICY "Users can insert profile views"
  ON profile_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- ============================================
-- BOOSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boosts_user_id ON boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_boosts_ends_at ON boosts(ends_at);

ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own boosts"
  ON boosts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boosts"
  ON boosts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- REWINDS TABLE (undo last swipe)
-- ============================================
CREATE TABLE IF NOT EXISTS rewinds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_like_id UUID REFERENCES likes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewinds_user_id ON rewinds(user_id);

ALTER TABLE rewinds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewinds"
  ON rewinds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewinds"
  ON rewinds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TOP PICKS TABLE (curated daily matches)
-- ============================================
CREATE TABLE IF NOT EXISTS top_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  picked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_date DATE DEFAULT CURRENT_DATE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(user_id, picked_user_id, created_date)
);

CREATE INDEX IF NOT EXISTS idx_top_picks_user_id ON top_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_top_picks_expires_at ON top_picks(expires_at);

ALTER TABLE top_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own top picks"
  ON top_picks FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- MESSAGE REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL, -- emoji
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions in their messages"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN matches ON messages.match_id = matches.id
      WHERE messages.id = message_reactions.message_id
      AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())
    )
  );

CREATE POLICY "Users can insert own reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- EXTEND MESSAGES TABLE
-- ============================================
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'video', 'gif', 'location', 'photo')),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER, -- for voice/video messages
ADD COLUMN IF NOT EXISTS reactions_count INTEGER DEFAULT 0;

-- ============================================
-- ICEBREAKERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS icebreakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default icebreakers
INSERT INTO icebreakers (question, category) VALUES
  ('What''s your favorite way to spend a weekend?', 'lifestyle'),
  ('If you could travel anywhere, where would you go?', 'travel'),
  ('What''s the best meal you''ve ever had?', 'food'),
  ('What''s something you''re passionate about?', 'interests'),
  ('What''s your go-to karaoke song?', 'fun'),
  ('What''s the most spontaneous thing you''ve done?', 'adventure'),
  ('What''s your ideal first date?', 'dating'),
  ('What''s something on your bucket list?', 'goals'),
  ('What''s your favorite book or movie?', 'entertainment'),
  ('What makes you laugh the most?', 'personality')
ON CONFLICT DO NOTHING;

-- ============================================
-- STORIES TABLE (24-hour photos/videos)
-- ============================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  views_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active stories"
  ON stories FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Users can insert own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- STORY VIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view story views"
  ON story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_views.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert story views"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view events"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- ============================================
-- EVENT RSVPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view event RSVPs"
  ON event_rsvps FOR SELECT
  USING (true);

CREATE POLICY "Users can RSVP to events"
  ON event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ACHIEVEMENTS/BADGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public achievements"
  ON achievements FOR SELECT
  USING (true);

-- ============================================
-- USER STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  daily_likes_sent INTEGER DEFAULT 0,
  daily_likes_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  daily_superlikes_sent INTEGER DEFAULT 0,
  daily_superlikes_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_swipes INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- EXTEND PREFERENCES TABLE
-- ============================================
ALTER TABLE preferences
ADD COLUMN IF NOT EXISTS height_min INTEGER,
ADD COLUMN IF NOT EXISTS height_max INTEGER,
ADD COLUMN IF NOT EXISTS education_preferences TEXT[],
ADD COLUMN IF NOT EXISTS dealbreakers JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update profile views count
CREATE OR REPLACE FUNCTION update_profile_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET profile_views_count = profile_views_count + 1
  WHERE id = NEW.viewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_view
  AFTER INSERT ON profile_views
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_views_count();

-- Function to update likes received count
CREATE OR REPLACE FUNCTION update_likes_received_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kind IN ('like', 'superlike') THEN
    UPDATE profiles
    SET likes_received_count = likes_received_count + 1
    WHERE id = NEW.to_user;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_received
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_likes_received_count();

-- Function to update matches count
CREATE OR REPLACE FUNCTION update_matches_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET matches_count = matches_count + 1
  WHERE id = NEW.user_a OR id = NEW.user_b;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_match_created
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_matches_count();

-- Function to calculate profile strength
CREATE OR REPLACE FUNCTION calculate_profile_strength(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  strength INTEGER := 0;
  has_photos BOOLEAN;
  has_bio BOOLEAN;
  has_interests BOOLEAN;
  has_location BOOLEAN;
  photo_count INTEGER;
BEGIN
  -- Check profile completeness
  SELECT 
    COUNT(*) > 0,
    bio IS NOT NULL AND LENGTH(TRIM(bio)) > 20,
    array_length(interests, 1) > 0,
    location IS NOT NULL,
    (SELECT COUNT(*) FROM profile_media WHERE user_id = profile_id)
  INTO has_photos, has_bio, has_interests, has_location, photo_count
  FROM profiles
  WHERE id = profile_id;
  
  -- Calculate strength (0-100)
  IF has_photos THEN strength := strength + 30; END IF;
  IF photo_count >= 3 THEN strength := strength + 10; END IF;
  IF has_bio THEN strength := strength + 20; END IF;
  IF has_interests THEN strength := strength + 15; END IF;
  IF has_location THEN strength := strength + 10; END IF;
  IF (SELECT verified FROM profiles WHERE id = profile_id) THEN strength := strength + 15; END IF;
  
  RETURN LEAST(strength, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last_active and is_online
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_active = NOW(), is_online = TRUE
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online) WHERE is_online = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_strength ON profiles(profile_strength DESC);

