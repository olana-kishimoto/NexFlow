/*
  # Add is_suspended column to profiles table

  1. New Columns
    - `is_suspended` (boolean, default: false) - Track if user is suspended/banned
  
  2. Security
    - This field is used to track suspension status alongside Supabase Auth ban_duration
    - RLS policies already in place continue to apply
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_suspended'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_suspended boolean NOT NULL DEFAULT false;
  END IF;
END $$;