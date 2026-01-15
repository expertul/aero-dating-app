-- Smart Features Database Schema
-- Photo Engagement Tracking
CREATE TABLE IF NOT EXISTS photo_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES profile_media(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('view', 'like', 'match', 'superlike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(photo_id, viewer_id, engagement_type)
);

CREATE INDEX IF NOT EXISTS idx_photo_engagement_photo ON photo_engagement(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_engagement_profile ON photo_engagement(profile_id);

-- Conversation Analytics
CREATE TABLE IF NOT EXISTS conversation_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  health_score INTEGER DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0,
  avg_message_length INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  topics JSONB DEFAULT '[]'::jsonb,
  last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_analytics_match ON conversation_analytics(match_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_user ON conversation_analytics(user_id);

-- User Behavior Tracking (for adaptive feed)
CREATE TABLE IF NOT EXISTS user_behavior (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('swipe_like', 'swipe_pass', 'swipe_superlike', 'view_profile', 'send_message', 'open_chat')),
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_action ON user_behavior(action_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created ON user_behavior(created_at DESC);

-- Profile Analytics
CREATE TABLE IF NOT EXISTS profile_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  match_rate DECIMAL(5,2) DEFAULT 0,
  best_photo_id UUID REFERENCES profile_media(id),
  peak_activity_hour INTEGER,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_analytics_profile ON profile_analytics(profile_id);

-- Notification Preferences (for smart timing)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  quiet_hours_start INTEGER DEFAULT 22, -- 10 PM
  quiet_hours_end INTEGER DEFAULT 8, -- 8 AM
  preferred_notification_times INTEGER[] DEFAULT ARRAY[18, 19, 20, 21], -- 6-9 PM
  enabled_notification_types JSONB DEFAULT '{"messages": true, "likes": true, "matches": true}'::jsonb,
  last_active_hour INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- RLS Policies
ALTER TABLE photo_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Photo Engagement: Users can view their own engagement stats
CREATE POLICY "Users can view own photo engagement"
  ON photo_engagement FOR SELECT
  USING (profile_id = auth.uid());

-- Conversation Analytics: Users can view their own analytics
CREATE POLICY "Users can view own conversation analytics"
  ON conversation_analytics FOR SELECT
  USING (user_id = auth.uid());

-- User Behavior: Users can insert their own behavior
CREATE POLICY "Users can insert own behavior"
  ON user_behavior FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Profile Analytics: Users can view their own analytics
CREATE POLICY "Users can view own profile analytics"
  ON profile_analytics FOR SELECT
  USING (profile_id = auth.uid());

-- Notification Preferences: Users can manage their own preferences
CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can access all (for background jobs)
CREATE POLICY "Service role can access all photo engagement"
  ON photo_engagement FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can access all conversation analytics"
  ON conversation_analytics FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can access all user behavior"
  ON user_behavior FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can access all profile analytics"
  ON profile_analytics FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

