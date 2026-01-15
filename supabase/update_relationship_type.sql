-- Update relationship_type column to support arrays (TEXT[])
-- This allows users to select multiple relationship types (max 3)

-- Step 1: Check current type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'relationship_type';

-- Step 2: If it's TEXT, convert to TEXT[]
DO $$
BEGIN
  -- Check if column is TEXT (not TEXT[])
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'relationship_type'
    AND data_type = 'text'
    AND udt_name = 'text'
  ) THEN
    -- Convert TEXT to TEXT[] (convert existing values to single-element arrays)
    ALTER TABLE profiles 
    ALTER COLUMN relationship_type TYPE TEXT[] USING 
      CASE 
        WHEN relationship_type IS NULL THEN NULL::TEXT[]
        WHEN trim(relationship_type) = '' THEN NULL::TEXT[]
        ELSE ARRAY[relationship_type]::TEXT[]
      END;
      
    RAISE NOTICE 'Column converted from TEXT to TEXT[]';
  ELSE
    RAISE NOTICE 'Column is already TEXT[] or different type';
  END IF;
END $$;

-- Step 3: Verify the change
SELECT id, name, relationship_type, pg_typeof(relationship_type) as column_type
FROM profiles 
LIMIT 5;

