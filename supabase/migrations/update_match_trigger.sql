-- Update the match creation trigger to handle both 'like' and 'superlike'
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a mutual like (either 'like' or 'superlike' counts)
  IF NEW.kind IN ('like', 'superlike') AND EXISTS (
    SELECT 1 FROM likes
    WHERE from_user = NEW.to_user
    AND to_user = NEW.from_user
    AND kind IN ('like', 'superlike')
  ) THEN
    -- Create match (ensure user_a < user_b for uniqueness)
    INSERT INTO matches (user_a, user_b)
    VALUES (
      LEAST(NEW.from_user, NEW.to_user),
      GREATEST(NEW.from_user, NEW.to_user)
    )
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


