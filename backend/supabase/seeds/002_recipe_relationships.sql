-- ============================================================
-- FoodBot Seed: Recipe Relationships
-- Run AFTER 001_seed.sql
-- Seeds: recipe_ingredients, recipe_dietary_tags, recipe_allergens
-- Safe to re-run (ON CONFLICT DO NOTHING)
-- ============================================================

-- ── recipe_ingredients ─────────────────────────────────────
-- Lemon Garlic Chicken (recipe 01)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', ingredient_id, false
FROM ingredients WHERE name IN ('chicken','garlic','lemon','olive oil','salt','pepper')
ON CONFLICT DO NOTHING;

-- Garlic Butter Chicken Thighs (recipe 02)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', ingredient_id, false
FROM ingredients WHERE name IN ('chicken','garlic','butter','thyme','salt','pepper')
ON CONFLICT DO NOTHING;

-- Beef Fried Rice (recipe 03)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', ingredient_id, false
FROM ingredients WHERE name IN ('rice','beef','egg','soy sauce','garlic','onion','oil')
ON CONFLICT DO NOTHING;

-- Tomato Pasta (recipe 04)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', ingredient_id, false
FROM ingredients WHERE name IN ('pasta','tomato','garlic','olive oil','basil','salt')
ON CONFLICT DO NOTHING;

-- Scrambled Eggs on Toast (recipe 05)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567805', ingredient_id, false
FROM ingredients WHERE name IN ('egg','butter','bread','salt','pepper')
ON CONFLICT DO NOTHING;

-- Chicken Fried Rice (recipe 06)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567806', ingredient_id, false
FROM ingredients WHERE name IN ('rice','chicken','egg','soy sauce','garlic','spring onion','oil')
ON CONFLICT DO NOTHING;

-- Vegetable Stir Fry (recipe 07)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567807', ingredient_id, false
FROM ingredients WHERE name IN ('broccoli','carrot','capsicum','garlic','soy sauce','oil','onion')
ON CONFLICT DO NOTHING;

-- Honey Soy Salmon (recipe 08)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567808', ingredient_id, false
FROM ingredients WHERE name IN ('salmon','soy sauce','honey','garlic','ginger','oil')
ON CONFLICT DO NOTHING;

-- Mushroom Omelette (recipe 09)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567809', ingredient_id, false
FROM ingredients WHERE name IN ('egg','mushroom','butter','cheese','salt','pepper')
ON CONFLICT DO NOTHING;

-- Minestrone Soup (recipe 10)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567810', ingredient_id, false
FROM ingredients WHERE name IN ('tomato','carrot','onion','celery','pasta','garlic','olive oil','salt')
ON CONFLICT DO NOTHING;

-- ── recipe_dietary_tags ─────────────────────────────────────
-- DB tag names: Halal, Vegan, Vegetarian, GlutenFree

-- Lemon Garlic Chicken → Halal, GlutenFree
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', tag_id
FROM dietary_tags WHERE name IN ('Halal','GlutenFree')
ON CONFLICT DO NOTHING;

-- Garlic Butter Chicken Thighs → Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', tag_id
FROM dietary_tags WHERE name = 'Halal'
ON CONFLICT DO NOTHING;

-- Beef Fried Rice → Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', tag_id
FROM dietary_tags WHERE name = 'Halal'
ON CONFLICT DO NOTHING;

-- Tomato Pasta → Vegetarian
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', tag_id
FROM dietary_tags WHERE name = 'Vegetarian'
ON CONFLICT DO NOTHING;

-- Scrambled Eggs on Toast → Vegetarian
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567805', tag_id
FROM dietary_tags WHERE name = 'Vegetarian'
ON CONFLICT DO NOTHING;

-- Chicken Fried Rice → Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567806', tag_id
FROM dietary_tags WHERE name = 'Halal'
ON CONFLICT DO NOTHING;

-- Vegetable Stir Fry → Vegan, Vegetarian, GlutenFree, Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567807', tag_id
FROM dietary_tags WHERE name IN ('Vegan','Vegetarian','GlutenFree','Halal')
ON CONFLICT DO NOTHING;

-- Honey Soy Salmon → GlutenFree
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567808', tag_id
FROM dietary_tags WHERE name = 'GlutenFree'
ON CONFLICT DO NOTHING;

-- Mushroom Omelette → Vegetarian, GlutenFree
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567809', tag_id
FROM dietary_tags WHERE name IN ('Vegetarian','GlutenFree')
ON CONFLICT DO NOTHING;

-- Minestrone Soup → Vegan, Vegetarian
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567810', tag_id
FROM dietary_tags WHERE name IN ('Vegan','Vegetarian')
ON CONFLICT DO NOTHING;

-- ── recipe_allergens ────────────────────────────────────────
-- DB allergen names: Peanuts, Dairy, Gluten, Shellfish, Eggs, Soy

-- Garlic Butter Chicken Thighs → Dairy
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', allergen_id
FROM allergens WHERE name = 'Dairy'
ON CONFLICT DO NOTHING;

-- Beef Fried Rice → Soy, Eggs
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', allergen_id
FROM allergens WHERE name IN ('Soy','Eggs')
ON CONFLICT DO NOTHING;

-- Tomato Pasta → Gluten
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', allergen_id
FROM allergens WHERE name = 'Gluten'
ON CONFLICT DO NOTHING;

-- Scrambled Eggs on Toast → Eggs, Dairy, Gluten
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567805', allergen_id
FROM allergens WHERE name IN ('Eggs','Dairy','Gluten')
ON CONFLICT DO NOTHING;

-- Chicken Fried Rice → Soy, Eggs
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567806', allergen_id
FROM allergens WHERE name IN ('Soy','Eggs')
ON CONFLICT DO NOTHING;

-- Vegetable Stir Fry → Soy
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567807', allergen_id
FROM allergens WHERE name = 'Soy'
ON CONFLICT DO NOTHING;

-- Honey Soy Salmon → Soy
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567808', allergen_id
FROM allergens WHERE name = 'Soy'
ON CONFLICT DO NOTHING;

-- Mushroom Omelette → Eggs, Dairy
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567809', allergen_id
FROM allergens WHERE name IN ('Eggs','Dairy')
ON CONFLICT DO NOTHING;

-- Minestrone Soup → Gluten
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567810', allergen_id
FROM allergens WHERE name = 'Gluten'
ON CONFLICT DO NOTHING;

-- ── Verify row counts ───────────────────────────────────────
SELECT 'recipe_ingredients' AS tbl, COUNT(*) FROM recipe_ingredients
UNION ALL SELECT 'recipe_dietary_tags', COUNT(*) FROM recipe_dietary_tags
UNION ALL SELECT 'recipe_allergens', COUNT(*) FROM recipe_allergens;
-- Expected: recipe_ingredients = 60, recipe_dietary_tags = 14, recipe_allergens = 14
