-- ============================================================
-- FYP-26-S2-6 AI Food Assistant Chatbot (FoodBot)
-- Initial Schema — 20 tables
-- Run in Supabase SQL Editor
-- ============================================================

-- Reference tables (no FKs outward)
CREATE TABLE dietary_tags (
  tag_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar NOT NULL UNIQUE
  -- Values: Halal, Vegan, Vegetarian, GlutenFree
);

CREATE TABLE allergens (
  allergen_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         varchar NOT NULL UNIQUE
  -- Values: Peanuts, Dairy, Gluten, Shellfish, Eggs, Soy
);

CREATE TABLE faq_entries (
  faq_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question    text NOT NULL,
  answer      text NOT NULL,
  category    varchar,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamp NOT NULL DEFAULT now()
);

-- Core entity tables
CREATE TABLE users (
  user_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          varchar NOT NULL UNIQUE,
  name           varchar NOT NULL,
  password_hash  varchar NOT NULL,
  role           varchar NOT NULL DEFAULT 'registered'
                   CHECK (role IN ('guest', 'registered', 'admin')),
  is_locked      boolean NOT NULL DEFAULT false,
  lock_until     timestamp,
  created_at     timestamp NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  session_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at   timestamp NOT NULL DEFAULT now(),
  last_activity timestamp NOT NULL DEFAULT now(),
  expires_at   timestamp NOT NULL,
  is_active    boolean NOT NULL DEFAULT true
);

CREATE TABLE recipes (
  recipe_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar NOT NULL,
  description   text,
  instructions  text,
  cooking_time  int,
  servings      int,
  category      varchar,
  source        varchar NOT NULL DEFAULT 'db'
                  CHECK (source IN ('db', 'ai')),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamp NOT NULL DEFAULT now()
);

CREATE TABLE ingredients (
  ingredient_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           varchar NOT NULL UNIQUE,
  category       varchar CHECK (category IN ('Produce','Dairy','Pantry','Meat','Seafood','Other'))
);

-- Junction tables
CREATE TABLE recipe_ingredients (
  recipe_id     uuid NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
  quantity      decimal,
  unit          varchar,
  is_optional   boolean NOT NULL DEFAULT false,
  PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE TABLE recipe_dietary_tags (
  recipe_id  uuid NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES dietary_tags(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE TABLE recipe_allergens (
  recipe_id   uuid NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  allergen_id uuid NOT NULL REFERENCES allergens(allergen_id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, allergen_id)
);

-- Nutrition (1-to-1 with recipes)
CREATE TABLE nutrition_info (
  nutrition_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     uuid NOT NULL UNIQUE REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  calories      decimal,
  protein_g     decimal,
  carbs_g       decimal,
  fats_g        decimal,
  fibre_g       decimal
);

-- User preference tables
CREATE TABLE user_dietary_preferences (
  user_id  uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES dietary_tags(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE user_allergens (
  user_id     uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  allergen_id uuid NOT NULL REFERENCES allergens(allergen_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, allergen_id)
);

CREATE TABLE user_favourites (
  user_id    uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  recipe_id  uuid NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  saved_at   timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

-- Meal planning
CREATE TABLE meal_plans (
  plan_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  week_start_date  date NOT NULL,
  created_at       timestamp NOT NULL DEFAULT now()
);

CREATE TABLE meal_plan_items (
  item_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid NOT NULL REFERENCES meal_plans(plan_id) ON DELETE CASCADE,
  recipe_id   uuid NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  day_of_week varchar NOT NULL CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  meal_type   varchar NOT NULL CHECK (meal_type IN ('B','L','D'))
);

-- Shopping lists
CREATE TABLE shopping_lists (
  list_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE shopping_list_items (
  item_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id       uuid NOT NULL REFERENCES shopping_lists(list_id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
  quantity      decimal,
  unit          varchar,
  is_checked    boolean NOT NULL DEFAULT false
);

-- Support
CREATE TABLE support_requests (
  request_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(user_id) ON DELETE SET NULL,
  message     text NOT NULL,
  status      varchar NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at  timestamp NOT NULL DEFAULT now()
);

-- Error logging
CREATE TABLE error_logs (
  log_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(user_id) ON DELETE SET NULL,
  error_type  varchar NOT NULL,
  message     text NOT NULL,
  endpoint    varchar,
  created_at  timestamp NOT NULL DEFAULT now(),
  is_resolved boolean NOT NULL DEFAULT false
);
