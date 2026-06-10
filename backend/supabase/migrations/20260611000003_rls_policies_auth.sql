-- Phase 2: RLS Policies
-- The Express backend always uses the service role key (bypasses RLS) for writes.
-- These policies protect direct Supabase Data API access from the anon key.

-- users: authenticated users may read their own row only
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- sessions: anon can insert guest sessions (user_id must be NULL)
CREATE POLICY "sessions_insert_guest" ON sessions
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- sessions: authenticated users can read/update their own sessions
CREATE POLICY "sessions_own" ON sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- user preferences: authenticated users read/write their own rows only
CREATE POLICY "user_dietary_prefs_own" ON user_dietary_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_allergens_own" ON user_allergens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_favourites_own" ON user_favourites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- recipes: public read (active only)
CREATE POLICY "recipes_public_read" ON recipes
  FOR SELECT USING (is_active = true);

-- ingredients, dietary_tags, allergens, faq_entries: public read
CREATE POLICY "ingredients_public_read" ON ingredients
  FOR SELECT USING (true);

CREATE POLICY "dietary_tags_public_read" ON dietary_tags
  FOR SELECT USING (true);

CREATE POLICY "allergens_public_read" ON allergens
  FOR SELECT USING (true);

CREATE POLICY "faq_entries_public_read" ON faq_entries
  FOR SELECT USING (is_active = true);

-- error_logs, support_requests, meal_plans, meal_plan_items,
-- shopping_lists, shopping_list_items, recipe_ingredients, recipe_dietary_tags,
-- recipe_allergens, nutrition_info: no direct anon/authenticated access
-- (all access goes through the backend service role)
