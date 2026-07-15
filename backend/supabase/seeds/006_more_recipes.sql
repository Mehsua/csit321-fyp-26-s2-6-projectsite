-- ============================================================
-- FoodBot Seed: 20 Additional Recipes (recipes 11–30)
-- Run AFTER 002_recipe_relationships.sql and 003_nutrition_seed.sql
-- Safe to re-run (ON CONFLICT DO NOTHING)
-- ============================================================

-- ── New Ingredients (28 additions) ────────────────────────────────────────────
INSERT INTO ingredients (name, category) VALUES
  ('cream',        'Dairy'),
  ('coconut milk', 'Pantry'),
  ('curry powder', 'Pantry'),
  ('turmeric',     'Pantry'),
  ('cumin',        'Pantry'),
  ('paprika',      'Pantry'),
  ('spinach',      'Produce'),
  ('feta cheese',  'Dairy'),
  ('cucumber',     'Produce'),
  ('avocado',      'Produce'),
  ('lime',         'Produce'),
  ('prawn',        'Seafood'),
  ('noodle',       'Pantry'),
  ('peanut',       'Pantry'),
  ('flour',        'Pantry'),
  ('potato',       'Produce'),
  ('lettuce',      'Produce'),
  ('parmesan',     'Dairy'),
  ('banana',       'Produce'),
  ('milk',         'Dairy'),
  ('yogurt',       'Dairy'),
  ('lentil',       'Pantry'),
  ('tortilla',     'Pantry'),
  ('miso paste',   'Pantry'),
  ('tofu',         'Pantry'),
  ('corn',         'Produce'),
  ('bean sprout',  'Produce'),
  ('sesame oil',   'Pantry')
ON CONFLICT (name) DO NOTHING;

-- ── 20 New Recipes ────────────────────────────────────────────────────────────
INSERT INTO recipes (recipe_id, name, description, instructions, cooking_time, servings, category, source) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567811', 'Butter Chicken',
   'Creamy, mildly spiced Indian chicken curry.',
   '1. Cube chicken and season with turmeric and salt. 2. Fry chicken in butter until lightly golden, set aside. 3. Sauté onion until deep golden, 8 mins. 4. Add garlic, ginger, tomato, cumin, turmeric, paprika, cook 5 mins. 5. Pour in cream and 100ml water, stir smooth. 6. Return chicken, simmer 10 mins. 7. Serve with rice.',
   45, 3, 'Indian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567812', 'Vegetable Curry',
   'A hearty plant-based curry with coconut milk.',
   '1. Peel and cube potato and carrot. 2. Fry onion in oil over medium heat until soft. 3. Add garlic, ginger, curry powder, turmeric, stir 1 min. 4. Add potato, carrot, diced tomato and stir to coat. 5. Pour in coconut milk and 200ml water. 6. Simmer 20 mins until vegetables are tender. 7. Season with salt and serve with rice.',
   35, 3, 'Indian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567813', 'Spaghetti Bolognese',
   'Classic Italian meat sauce served with pasta.',
   '1. Finely dice onion, carrot, and celery. 2. Brown beef in hot oil, breaking up with a spoon. 3. Add diced vegetables, cook 5 mins. 4. Add garlic, cook 1 min. 5. Add crushed tomatoes, season well. 6. Simmer 30 mins until sauce thickens. 7. Cook pasta al dente, toss with sauce.',
   50, 4, 'Italian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567814', 'Pad Thai',
   'Classic Thai stir-fried rice noodles with prawn and peanuts.',
   '1. Soak noodles in warm water 15 mins, drain. 2. Heat oil in wok until very hot. 3. Fry garlic 30 seconds, add prawn and cook until pink. 4. Push to side, scramble egg in centre. 5. Add noodles, toss on high heat. 6. Add bean sprouts and soy sauce, toss well. 7. Serve with lime wedge and crushed peanuts.',
   30, 2, 'Asian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567815', 'Greek Salad',
   'Fresh Mediterranean salad with feta and olives.',
   '1. Chop tomatoes and cucumber into rough chunks. 2. Place in a large bowl. 3. Crumble feta cheese generously over the top. 4. Drizzle with olive oil. 5. Squeeze fresh lemon juice over the salad. 6. Season with salt and freshly ground pepper. 7. Toss gently and serve immediately.',
   10, 2, 'Mediterranean', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567816', 'Prawn Stir Fry',
   'Quick and fresh Asian prawn and vegetable stir fry.',
   '1. Devein and rinse prawns, pat dry. 2. Cut capsicum and broccoli into bite-size pieces. 3. Heat wok on high until smoking. 4. Add oil, fry garlic and ginger 30 seconds. 5. Add capsicum and broccoli, stir-fry 3 mins. 6. Add prawns, toss until pink. 7. Splash in soy sauce, garnish with spring onion.',
   20, 2, 'Asian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567817', 'Mushroom Risotto',
   'Creamy Italian risotto with golden sautéed mushrooms.',
   '1. Warm 1L water or stock in a separate pot. 2. Sauté onion and garlic in olive oil until soft. 3. Slice mushrooms, add and cook until golden. 4. Add rice, stir 2 mins to coat. 5. Add warm liquid one ladle at a time, stirring constantly until absorbed. 6. After 20 mins, stir in butter and grated parmesan. 7. Season and serve immediately.',
   35, 2, 'Italian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567818', 'Avocado Toast',
   'Simple and nutritious smashed avocado on toasted bread.',
   '1. Toast bread to your preferred doneness. 2. Halve avocado, remove pit, scoop flesh into bowl. 3. Mash avocado until creamy but slightly chunky. 4. Add a squeeze of lemon juice. 5. Season with salt and pepper. 6. Spread avocado mixture onto toast. 7. Serve immediately.',
   8, 1, 'Western', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567819', 'Teriyaki Salmon Bowl',
   'Glazed salmon over steamed rice with sweet teriyaki sauce.',
   '1. Cook rice according to package. 2. Mix soy sauce, honey, minced garlic, grated ginger for glaze. 3. Marinate salmon in glaze 15 mins. 4. Heat sesame oil in pan over medium-high. 5. Sear salmon 4 mins per side, basting with glaze. 6. Slice salmon, arrange over rice. 7. Drizzle remaining glaze, garnish with spring onion.',
   30, 2, 'Asian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef123456781a', 'Spinach and Feta Omelette',
   'Fluffy omelette filled with wilted spinach and creamy feta.',
   '1. Melt butter in non-stick pan over medium heat. 2. Add spinach, cook until wilted, 2 mins. 3. Remove spinach and set aside. 4. Whisk 3 eggs with salt and pepper. 5. Pour eggs into pan. 6. When edges set, add wilted spinach and crumbled feta to one side. 7. Fold omelette in half, slide onto plate.',
   12, 1, 'Western', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef123456781b', 'Dhal',
   'Comforting Indian red lentil stew, vegan and high in protein.',
   '1. Rinse red lentils under cold water until clear. 2. Fry onion in oil until deep golden, 8 mins. 3. Add garlic, ginger, cumin, turmeric, cook 1 min. 4. Add diced tomato, cook 5 mins until softened. 5. Add lentils and 600ml water, bring to boil. 6. Simmer 20 mins until lentils are soft and creamy. 7. Season with salt, serve with rice or bread.',
   35, 3, 'Indian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef123456781c', 'Chicken Tikka Masala',
   'Rich, aromatic tomato and cream-based Indian chicken curry.',
   '1. Cube chicken, marinate in yogurt, garlic, ginger, turmeric, cumin 1 hour. 2. Pan-fry marinated chicken until lightly charred, set aside. 3. Blend onion and tomato to smooth paste. 4. Fry paste in oil 8 mins until darkened. 5. Add paprika, cumin, turmeric, cook 2 mins. 6. Stir in cream, bring to gentle simmer. 7. Add chicken, simmer 15 mins. Serve with rice.',
   50, 3, 'Indian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef123456781d', 'Caesar Salad',
   'Crisp romaine lettuce, croutons, and parmesan in a classic dressing.',
   '1. Cube bread, toss in olive oil, bake at 180°C 10 mins for croutons. 2. Separate egg yolk into bowl. 3. Whisk yolk with garlic, lemon juice, and olive oil until emulsified. 4. Tear lettuce into chunks. 5. Pour dressing over lettuce, toss to coat. 6. Add croutons and shaved parmesan. 7. Season with salt and pepper.',
   20, 2, 'Western', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef123456781e', 'Banana Pancakes',
   'Simple two-ingredient banana pancakes — naturally sweet.',
   '1. Mash a ripe banana thoroughly. 2. Whisk in 2 eggs until smooth. 3. Add flour and pinch of salt, stir gently. 4. Add a splash of milk to loosen batter. 5. Melt butter in non-stick pan over medium heat. 6. Pour small ladles of batter, cook 2 mins each side until golden. 7. Serve with honey or fresh fruit.',
   20, 1, 'Western', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef123456781f', 'Miso Soup',
   'Traditional Japanese soup with tofu and spring onion.',
   '1. Bring 4 cups water to a gentle simmer. Do not boil. 2. Cut tofu into small cubes. 3. Place miso paste in a small bowl, ladle in hot water and whisk until dissolved. 4. Pour dissolved miso back into pot. 5. Add tofu cubes. 6. Simmer on low 2 mins. 7. Ladle into bowls, top with sliced spring onion.',
   10, 2, 'Asian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567820', 'Beef Tacos',
   'Mexican seasoned beef in warm tortillas with fresh toppings.',
   '1. Brown minced beef in a hot pan, breaking up lumps. 2. Drain excess fat. 3. Add diced onion and garlic, cook 3 mins. 4. Season with cumin, paprika, salt, and pepper. 5. Add diced tomato, cook 5 mins until sauce thickens. 6. Warm tortillas in a dry pan. 7. Fill with beef mixture and a squeeze of lime.',
   25, 3, 'Mexican', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567821', 'Chicken Noodle Soup',
   'Warming Asian-style chicken soup with noodles and vegetables.',
   '1. Place chicken in a pot, cover with 1.5L cold water, bring to boil. 2. Skim foam, reduce heat and simmer 20 mins. 3. Remove chicken, shred meat, reserve broth. 4. Sauté onion, carrot, celery in pot 5 mins. 5. Add garlic, cook 1 min. 6. Pour in reserved broth, bring to boil. 7. Add noodles and shredded chicken, cook until tender. Season with salt and pepper.',
   40, 3, 'Asian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567822', 'Garlic Prawn Pasta',
   'Italian pasta tossed with butter-fried garlic prawns and lemon.',
   '1. Cook pasta in salted boiling water until al dente, reserve 1 cup pasta water. 2. Season prawns with salt and pepper. 3. Melt butter with olive oil in large pan. 4. Fry garlic 1 min until fragrant. 5. Add prawns, cook 2 mins per side until pink. 6. Add pasta and splash of pasta water, toss to coat. 7. Squeeze lemon juice, garnish with basil.',
   25, 2, 'Italian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567823', 'Corn and Egg Fried Rice',
   'Quick vegetarian fried rice with corn and scrambled egg.',
   '1. Use day-old refrigerated rice for best texture. 2. Heat wok on high until smoking. 3. Add oil, scramble egg quickly and chop into pieces, set aside. 4. Fry onion and carrot 2 mins. 5. Add rice, press flat and fry 1 min untouched, then toss. 6. Add corn and egg, toss together. 7. Season with soy sauce, adjust salt and pepper.',
   20, 2, 'Asian', 'db'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567824', 'Chicken Caesar Wrap',
   'Grilled chicken, crisp lettuce, and parmesan in a flour tortilla.',
   '1. Season chicken with garlic, salt, and pepper. 2. Pan-fry chicken 6 mins per side until cooked through, rest 5 mins then slice. 3. Whisk olive oil, lemon juice, minced garlic for quick dressing. 4. Shave parmesan thinly. 5. Toss lettuce with dressing. 6. Warm tortilla in dry pan. 7. Layer sliced chicken, dressed lettuce, and parmesan on tortilla, roll tightly, slice diagonally.',
   25, 2, 'Western', 'db')
ON CONFLICT (recipe_id) DO NOTHING;

-- ── recipe_ingredients ────────────────────────────────────────────────────────
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567811', ingredient_id, false
FROM ingredients WHERE name IN ('chicken','onion','tomato','cream','garlic','ginger','butter','cumin','turmeric','paprika','salt','pepper')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567812', ingredient_id, false
FROM ingredients WHERE name IN ('potato','carrot','onion','coconut milk','tomato','garlic','ginger','curry powder','turmeric','salt','oil')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567813', ingredient_id, false
FROM ingredients WHERE name IN ('beef','pasta','tomato','onion','garlic','carrot','celery','olive oil','salt','pepper')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567814', ingredient_id, false
FROM ingredients WHERE name IN ('noodle','prawn','egg','spring onion','peanut','soy sauce','oil','garlic','lime','bean sprout')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567815', ingredient_id, false
FROM ingredients WHERE name IN ('tomato','cucumber','feta cheese','olive oil','salt','pepper','lemon')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567816', ingredient_id, false
FROM ingredients WHERE name IN ('prawn','capsicum','broccoli','garlic','ginger','soy sauce','oil','spring onion')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567817', ingredient_id, false
FROM ingredients WHERE name IN ('rice','mushroom','butter','parmesan','garlic','onion','olive oil','salt','pepper')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567818', ingredient_id, false
FROM ingredients WHERE name IN ('avocado','bread','lemon','salt','pepper')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567819', ingredient_id, false
FROM ingredients WHERE name IN ('salmon','rice','soy sauce','honey','garlic','ginger','spring onion','sesame oil')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781a', ingredient_id, false
FROM ingredients WHERE name IN ('egg','spinach','feta cheese','butter','salt','pepper')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781b', ingredient_id, false
FROM ingredients WHERE name IN ('lentil','onion','tomato','garlic','ginger','cumin','turmeric','oil','salt')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781c', ingredient_id, false
FROM ingredients WHERE name IN ('chicken','cream','tomato','yogurt','garlic','ginger','onion','oil','cumin','turmeric','paprika','salt')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781d', ingredient_id, false
FROM ingredients WHERE name IN ('lettuce','parmesan','bread','egg','olive oil','lemon','garlic','salt','pepper')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781e', ingredient_id, false
FROM ingredients WHERE name IN ('banana','egg','flour','milk','butter','salt')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781f', ingredient_id, false
FROM ingredients WHERE name IN ('miso paste','tofu','spring onion')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567820', ingredient_id, false
FROM ingredients WHERE name IN ('beef','tortilla','tomato','onion','garlic','cumin','paprika','salt','pepper','lime')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567821', ingredient_id, false
FROM ingredients WHERE name IN ('chicken','noodle','carrot','celery','onion','garlic','salt','pepper')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567822', ingredient_id, false
FROM ingredients WHERE name IN ('prawn','pasta','garlic','olive oil','lemon','butter','salt','pepper','basil')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567823', ingredient_id, false
FROM ingredients WHERE name IN ('rice','corn','carrot','onion','egg','soy sauce','oil','salt','pepper')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, is_optional)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567824', ingredient_id, false
FROM ingredients WHERE name IN ('chicken','lettuce','parmesan','tortilla','olive oil','lemon','garlic','salt','pepper')
ON CONFLICT DO NOTHING;

-- ── recipe_dietary_tags ───────────────────────────────────────────────────────
-- Butter Chicken: Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567811', tag_id FROM dietary_tags WHERE name IN ('Halal') ON CONFLICT DO NOTHING;

-- Vegetable Curry: Vegan, Vegetarian, GlutenFree, Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567812', tag_id FROM dietary_tags WHERE name IN ('Vegan','Vegetarian','GlutenFree','Halal') ON CONFLICT DO NOTHING;

-- Spaghetti Bolognese: (none — contains Gluten)

-- Pad Thai: (none)

-- Greek Salad: Vegetarian, GlutenFree, Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567815', tag_id FROM dietary_tags WHERE name IN ('Vegetarian','GlutenFree','Halal') ON CONFLICT DO NOTHING;

-- Prawn Stir Fry: GlutenFree, Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567816', tag_id FROM dietary_tags WHERE name IN ('GlutenFree','Halal') ON CONFLICT DO NOTHING;

-- Mushroom Risotto: Vegetarian
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567817', tag_id FROM dietary_tags WHERE name IN ('Vegetarian') ON CONFLICT DO NOTHING;

-- Avocado Toast: Vegan, Vegetarian
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567818', tag_id FROM dietary_tags WHERE name IN ('Vegan','Vegetarian') ON CONFLICT DO NOTHING;

-- Teriyaki Salmon Bowl: GlutenFree, Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567819', tag_id FROM dietary_tags WHERE name IN ('GlutenFree','Halal') ON CONFLICT DO NOTHING;

-- Spinach and Feta Omelette: Vegetarian, GlutenFree
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781a', tag_id FROM dietary_tags WHERE name IN ('Vegetarian','GlutenFree') ON CONFLICT DO NOTHING;

-- Dhal: Vegan, Vegetarian, GlutenFree, Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781b', tag_id FROM dietary_tags WHERE name IN ('Vegan','Vegetarian','GlutenFree','Halal') ON CONFLICT DO NOTHING;

-- Chicken Tikka Masala: Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781c', tag_id FROM dietary_tags WHERE name IN ('Halal') ON CONFLICT DO NOTHING;

-- Caesar Salad: Vegetarian
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781d', tag_id FROM dietary_tags WHERE name IN ('Vegetarian') ON CONFLICT DO NOTHING;

-- Banana Pancakes: Vegetarian
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781e', tag_id FROM dietary_tags WHERE name IN ('Vegetarian') ON CONFLICT DO NOTHING;

-- Miso Soup: Vegan, Vegetarian, GlutenFree
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781f', tag_id FROM dietary_tags WHERE name IN ('Vegan','Vegetarian','GlutenFree') ON CONFLICT DO NOTHING;

-- Beef Tacos: Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567820', tag_id FROM dietary_tags WHERE name IN ('Halal') ON CONFLICT DO NOTHING;

-- Chicken Noodle Soup: Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567821', tag_id FROM dietary_tags WHERE name IN ('Halal') ON CONFLICT DO NOTHING;

-- Garlic Prawn Pasta: (none)

-- Corn and Egg Fried Rice: Vegetarian, Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567823', tag_id FROM dietary_tags WHERE name IN ('Vegetarian','Halal') ON CONFLICT DO NOTHING;

-- Chicken Caesar Wrap: Halal
INSERT INTO recipe_dietary_tags (recipe_id, tag_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567824', tag_id FROM dietary_tags WHERE name IN ('Halal') ON CONFLICT DO NOTHING;

-- ── recipe_allergens ──────────────────────────────────────────────────────────
-- Butter Chicken: Dairy (cream)
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567811', allergen_id FROM allergens WHERE name IN ('Dairy') ON CONFLICT DO NOTHING;

-- Vegetable Curry: none

-- Spaghetti Bolognese: Gluten (pasta)
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567813', allergen_id FROM allergens WHERE name IN ('Gluten') ON CONFLICT DO NOTHING;

-- Pad Thai: Eggs, Peanuts, Shellfish, Soy
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567814', allergen_id FROM allergens WHERE name IN ('Eggs','Peanuts','Shellfish','Soy') ON CONFLICT DO NOTHING;

-- Greek Salad: Dairy (feta)
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567815', allergen_id FROM allergens WHERE name IN ('Dairy') ON CONFLICT DO NOTHING;

-- Prawn Stir Fry: Shellfish, Soy
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567816', allergen_id FROM allergens WHERE name IN ('Shellfish','Soy') ON CONFLICT DO NOTHING;

-- Mushroom Risotto: Dairy (parmesan, butter)
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567817', allergen_id FROM allergens WHERE name IN ('Dairy') ON CONFLICT DO NOTHING;

-- Avocado Toast: Gluten (bread)
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567818', allergen_id FROM allergens WHERE name IN ('Gluten') ON CONFLICT DO NOTHING;

-- Teriyaki Salmon Bowl: Soy
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567819', allergen_id FROM allergens WHERE name IN ('Soy') ON CONFLICT DO NOTHING;

-- Spinach and Feta Omelette: Eggs, Dairy
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781a', allergen_id FROM allergens WHERE name IN ('Eggs','Dairy') ON CONFLICT DO NOTHING;

-- Dhal: none

-- Chicken Tikka Masala: Dairy (cream, yogurt)
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781c', allergen_id FROM allergens WHERE name IN ('Dairy') ON CONFLICT DO NOTHING;

-- Caesar Salad: Eggs, Dairy, Gluten
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781d', allergen_id FROM allergens WHERE name IN ('Eggs','Dairy','Gluten') ON CONFLICT DO NOTHING;

-- Banana Pancakes: Eggs, Dairy, Gluten
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781e', allergen_id FROM allergens WHERE name IN ('Eggs','Dairy','Gluten') ON CONFLICT DO NOTHING;

-- Miso Soup: Soy
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef123456781f', allergen_id FROM allergens WHERE name IN ('Soy') ON CONFLICT DO NOTHING;

-- Beef Tacos: Gluten (tortilla)
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567820', allergen_id FROM allergens WHERE name IN ('Gluten') ON CONFLICT DO NOTHING;

-- Chicken Noodle Soup: Gluten (noodle)
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567821', allergen_id FROM allergens WHERE name IN ('Gluten') ON CONFLICT DO NOTHING;

-- Garlic Prawn Pasta: Shellfish, Gluten
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567822', allergen_id FROM allergens WHERE name IN ('Shellfish','Gluten') ON CONFLICT DO NOTHING;

-- Corn and Egg Fried Rice: Eggs, Soy
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567823', allergen_id FROM allergens WHERE name IN ('Eggs','Soy') ON CONFLICT DO NOTHING;

-- Chicken Caesar Wrap: Dairy, Gluten
INSERT INTO recipe_allergens (recipe_id, allergen_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567824', allergen_id FROM allergens WHERE name IN ('Dairy','Gluten') ON CONFLICT DO NOTHING;

-- ── nutrition_info (calories, protein_g, carbs_g, fats_g, fibre_g) ─────────
INSERT INTO nutrition_info (recipe_id, calories, protein_g, carbs_g, fats_g, fibre_g) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567811', 450, 35, 15, 28, 2.0),  -- Butter Chicken
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567812', 280,  5, 42, 11, 7.0),  -- Vegetable Curry
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567813', 520, 32, 55, 18, 4.0),  -- Spaghetti Bolognese
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567814', 480, 22, 62, 14, 3.0),  -- Pad Thai
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567815', 210,  7, 12, 16, 3.0),  -- Greek Salad
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567816', 280, 28, 12, 12, 4.0),  -- Prawn Stir Fry
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567817', 420, 12, 60, 14, 3.0),  -- Mushroom Risotto
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567818', 320,  7, 28, 20, 8.0),  -- Avocado Toast
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567819', 480, 38, 45, 14, 2.0),  -- Teriyaki Salmon Bowl
  ('a1b2c3d4-e5f6-7890-abcd-ef123456781a', 220, 16,  4, 16, 2.0),  -- Spinach and Feta Omelette
  ('a1b2c3d4-e5f6-7890-abcd-ef123456781b', 350, 18, 52,  8, 12.0), -- Dhal
  ('a1b2c3d4-e5f6-7890-abcd-ef123456781c', 520, 42, 20, 30, 3.0),  -- Chicken Tikka Masala
  ('a1b2c3d4-e5f6-7890-abcd-ef123456781d', 380, 12, 18, 28, 3.0),  -- Caesar Salad
  ('a1b2c3d4-e5f6-7890-abcd-ef123456781e', 340, 10, 58, 10, 3.0),  -- Banana Pancakes
  ('a1b2c3d4-e5f6-7890-abcd-ef123456781f',  80,  6,  8,  3, 1.0),  -- Miso Soup
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567820', 460, 28, 38, 20, 4.0),  -- Beef Tacos
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567821', 320, 28, 35,  6, 3.0),  -- Chicken Noodle Soup
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567822', 440, 24, 52, 14, 3.0),  -- Garlic Prawn Pasta
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567823', 380, 10, 65, 10, 4.0),  -- Corn and Egg Fried Rice
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567824', 520, 38, 35, 24, 4.0)   -- Chicken Caesar Wrap
ON CONFLICT (recipe_id) DO NOTHING;
