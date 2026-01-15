-- Add appearance settings to preferences table
ALTER TABLE preferences 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto')),
ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
ADD COLUMN IF NOT EXISTS animation_speed TEXT DEFAULT 'normal' CHECK (animation_speed IN ('fast', 'normal', 'slow')),
ADD COLUMN IF NOT EXISTS reduce_motion BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS feed_density TEXT DEFAULT 'normal' CHECK (feed_density IN ('compact', 'normal', 'spacious')),
ADD COLUMN IF NOT EXISTS haptic_feedback BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'us' CHECK (date_format IN ('us', 'eu', 'iso'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);
