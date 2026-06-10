-- Phase 2: Auth schema additions
-- Drop password_hash (Supabase Auth manages passwords; our public.users is a profile table)
-- Add fail_count and is_active to users
-- Fix all timestamp columns to timestamptz for UTC correctness

ALTER TABLE users
  DROP COLUMN IF EXISTS password_hash,
  ADD COLUMN IF NOT EXISTS fail_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE users
  ALTER COLUMN lock_until TYPE timestamptz USING lock_until AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE sessions
  ALTER COLUMN created_at    TYPE timestamptz USING created_at    AT TIME ZONE 'UTC',
  ALTER COLUMN last_activity TYPE timestamptz USING last_activity AT TIME ZONE 'UTC',
  ALTER COLUMN expires_at    TYPE timestamptz USING expires_at    AT TIME ZONE 'UTC';

ALTER TABLE recipes
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE faq_entries
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE support_requests
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE error_logs
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE user_favourites
  ALTER COLUMN saved_at TYPE timestamptz USING saved_at AT TIME ZONE 'UTC';

ALTER TABLE meal_plans
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE shopping_lists
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
