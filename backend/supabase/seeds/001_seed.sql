-- ============================================================
-- FoodBot Seed Data
-- Run AFTER 20260611000000_initial_schema.sql and 20260611000001_enable_rls.sql
-- Safe to re-run (ON CONFLICT DO NOTHING)
-- ============================================================

-- Dietary tags (4 rows)
INSERT INTO dietary_tags (name) VALUES
  ('Halal'), ('Vegan'), ('Vegetarian'), ('GlutenFree')
ON CONFLICT (name) DO NOTHING;

-- Allergens (6 rows)
INSERT INTO allergens (name) VALUES
  ('Peanuts'), ('Dairy'), ('Gluten'), ('Shellfish'), ('Eggs'), ('Soy')
ON CONFLICT (name) DO NOTHING;

-- Ingredients (28 rows)
INSERT INTO ingredients (name, category) VALUES
  ('chicken', 'Meat'),
  ('garlic', 'Produce'),
  ('lemon', 'Produce'),
  ('olive oil', 'Pantry'),
  ('salt', 'Pantry'),
  ('pepper', 'Pantry'),
  ('butter', 'Dairy'),
  ('thyme', 'Pantry'),
  ('rice', 'Pantry'),
  ('beef', 'Meat'),
  ('egg', 'Produce'),
  ('soy sauce', 'Pantry'),
  ('onion', 'Produce'),
  ('oil', 'Pantry'),
  ('pasta', 'Pantry'),
  ('tomato', 'Produce'),
  ('basil', 'Produce'),
  ('bread', 'Pantry'),
  ('mushroom', 'Produce'),
  ('cheese', 'Dairy'),
  ('carrot', 'Produce'),
  ('capsicum', 'Produce'),
  ('broccoli', 'Produce'),
  ('salmon', 'Seafood'),
  ('honey', 'Pantry'),
  ('ginger', 'Produce'),
  ('spring onion', 'Produce'),
  ('celery', 'Produce')
ON CONFLICT (name) DO NOTHING;

-- Recipes (10 rows) — fixed UUIDs make this idempotent on re-run
INSERT INTO recipes (recipe_id, name, description, instructions, cooking_time, servings, category, source)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Lemon Garlic Chicken', 'A simple and flavourful chicken dish.', '1. Season chicken with salt and pepper. 2. Heat olive oil in a pan over medium-high heat. 3. Sear chicken 5-6 mins each side until golden. 4. Add minced garlic and cook 1 min. 5. Squeeze lemon juice over chicken. 6. Rest 5 mins before serving.', 35, 2, 'Western', 'db'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Garlic Butter Chicken Thighs', 'Rich and juicy oven-finished chicken thighs.', '1. Pat chicken dry, season generously. 2. Melt butter in oven-safe skillet. 3. Sear thighs skin-side down 8 mins. 4. Flip, add garlic and thyme. 5. Bake at 200°C for 20 mins. 6. Baste with pan juices before serving.', 40, 2, 'Western', 'db'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Beef Fried Rice', 'Classic Asian fried rice with beef.', '1. Cook rice a day ahead and refrigerate. 2. Slice beef thinly, marinate in soy sauce. 3. Stir-fry beef in hot wok, set aside. 4. Scramble eggs, set aside. 5. Fry garlic and onion until fragrant. 6. Add rice, stir-fry on high heat. 7. Return beef and eggs, mix well.', 30, 2, 'Asian', 'db'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Tomato Pasta', 'A simple Italian tomato pasta.', '1. Boil salted water, cook pasta al dente. 2. Sauté garlic in olive oil 1 min. 3. Add crushed tomatoes, simmer 10 mins. 4. Season with salt and fresh basil. 5. Toss pasta in sauce. 6. Serve with optional parmesan.', 25, 2, 'Italian', 'db'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Scrambled Eggs on Toast', 'Quick and easy breakfast.', '1. Whisk eggs with salt and pepper. 2. Melt butter in non-stick pan on low heat. 3. Add eggs, stir gently and continuously. 4. Remove from heat while still slightly wet. 5. Toast bread. 6. Serve eggs on toast immediately.', 10, 1, 'Western', 'db'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567806', 'Chicken Fried Rice', 'Quick weeknight fried rice.', '1. Use day-old cold rice for best results. 2. Dice chicken, stir-fry until cooked. 3. Push aside, scramble egg in same wok. 4. Add garlic and rice, fry on high heat. 5. Season with soy sauce. 6. Garnish with chopped spring onion.', 25, 2, 'Asian', 'db'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Vegetable Stir Fry', 'Healthy and quick vegetable stir fry.', '1. Cut all vegetables into bite-size pieces. 2. Heat wok on high until smoking. 3. Add oil and fry garlic 30 seconds. 4. Add harder veg first (carrot, broccoli). 5. Add remaining veg, toss constantly. 6. Season with soy sauce, serve immediately.', 20, 2, 'Asian', 'db'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567808', 'Honey Soy Salmon', 'Sweet and savoury glazed salmon.', '1. Mix soy sauce, honey, garlic, ginger as marinade. 2. Marinate salmon 15+ mins. 3. Heat oil in pan over medium-high. 4. Cook salmon 4 mins skin side down. 5. Flip, pour marinade over, cook 3 more mins. 6. Baste with glaze before serving.', 25, 2, 'Asian', 'db'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567809', 'Mushroom Omelette', 'Classic fluffy omelette with mushrooms.', '1. Slice mushrooms, sauté in butter until golden. 2. Whisk 3 eggs with salt and pepper. 3. Pour eggs into same pan on medium. 4. When edges set, add mushrooms and cheese. 5. Fold omelette in half. 6. Slide onto plate and serve.', 13, 1, 'Western', 'db'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567810', 'Minestrone Soup', 'Hearty Italian vegetable soup.', '1. Sauté onion, carrot, celery in olive oil 5 mins. 2. Add garlic, cook 1 min. 3. Add crushed tomatoes and 1L water. 4. Simmer 15 mins. 5. Add pasta, cook until tender. 6. Season, serve with crusty bread.', 45, 4, 'Italian', 'db')
ON CONFLICT (recipe_id) DO NOTHING;
