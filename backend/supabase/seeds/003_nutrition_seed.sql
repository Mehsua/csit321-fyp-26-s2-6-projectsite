INSERT INTO nutrition_info (recipe_id, calories, protein_g, carbs_g, fats_g, fibre_g) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 285, 35, 5,  14, 0.5),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 420, 38, 3,  28, 0.5),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 480, 28, 55, 14, 2.0),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 380, 12, 68, 8,  4.0),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567805', 320, 18, 28, 16, 2.0),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567806', 420, 30, 52, 10, 2.0),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567807', 180, 6,  22, 8,  5.0),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567808', 340, 32, 18, 14, 0.5),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567809', 280, 16, 4,  22, 1.0),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567810', 220, 8,  38, 6,  6.0)
ON CONFLICT (recipe_id) DO NOTHING;
