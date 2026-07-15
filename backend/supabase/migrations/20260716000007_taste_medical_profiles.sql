-- ============================================================
-- FoodBot Migration 007: Taste Profile + Medical Profile tables
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Taste profile: one row per registered user (upsert pattern)
CREATE TABLE IF NOT EXISTS user_taste_profiles (
  user_id            uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  preferred_cuisines text[]  NOT NULL DEFAULT '{}',
  spice_level        varchar CHECK (spice_level IN ('mild','medium','spicy')) DEFAULT 'medium',
  max_cooking_time   int,  -- minutes; NULL means no preference
  updated_at         timestamp NOT NULL DEFAULT now()
);

-- Medical conditions: many rows per user (one per condition)
CREATE TABLE IF NOT EXISTS user_medical_conditions (
  user_id    uuid    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  condition  varchar NOT NULL CHECK (condition IN ('Diabetes','Hypertension','HeartDisease','WeightLoss')),
  PRIMARY KEY (user_id, condition)
);

-- Enable RLS
ALTER TABLE user_taste_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_medical_conditions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — all queries via supabaseAdmin will work.
-- Add permissive policies so the app service role can read/write freely.
CREATE POLICY "service role full access taste"
  ON user_taste_profiles FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "service role full access medical"
  ON user_medical_conditions FOR ALL
  USING (true) WITH CHECK (true);
