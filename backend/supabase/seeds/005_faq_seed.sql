-- 005_faq_seed.sql
-- FAQ entries for FoodBot customer support module (Phase 9)
-- Run in Supabase Dashboard → SQL Editor

INSERT INTO faq_entries (question, answer, category, is_active) VALUES
('How do I add my ingredients?',
 'Type your ingredients in the chat, separated by commas (e.g. "chicken, garlic, tomatoes"). FoodBot will extract and confirm the list before searching for recipes.',
 'Usage', true),

('What happens after I enter my ingredients?',
 'FoodBot extracts your ingredients and shows a confirmation step. You can confirm the list or edit it. After confirming, FoodBot recommends up to 5 recipes that match your ingredients.',
 'Usage', true),

('How do I save a recipe to my favourites?',
 'Open the recipe details by clicking on a recipe card. Click the heart icon to save it. You need to be logged in to save favourites. You can save up to 50 recipes.',
 'Usage', true),

('How do I set my dietary preferences?',
 'Click your name in the top bar to open the profile page. Under Dietary Preferences, select Halal, Vegan, Vegetarian, or Gluten-Free. Click Save Preferences. These filters apply to all future recipe recommendations.',
 'Usage', true),

('How do I generate a meal plan?',
 'Click the calendar button in the top bar. On the Meal Plan page, click Generate 3-Day Plan. FoodBot suggests recipes for each day based on your session ingredients, prioritising perishables for Day 1.',
 'Usage', true),

('How do I create a shopping list?',
 'Click the shopping cart button on a recipe card or inside recipe details to add missing ingredients to your list. Click the cart button in the top bar to view, check off, export, or clear your list.',
 'Usage', true),

('How do I reset the chat?',
 'Click the reset button in the top bar to clear the conversation and start a new session. Your saved favourites and preferences will not be affected.',
 'Usage', true),

('What dietary filters are available?',
 'FoodBot supports Halal, Vegan, Vegetarian, and Gluten-Free filters. Set these in your profile. Recipes that do not match your selected filters are excluded from recommendations.',
 'Features', true),

('Can guest users use FoodBot?',
 'Yes. Guests can enter ingredients, get recipe recommendations, and view cooking instructions. Saving favourites, dietary preferences, allergen settings, and meal plans require a registered account.',
 'Features', true),

('What is the allergen alert feature?',
 'Set your allergen profile in the profile page. FoodBot warns you when a recommended recipe contains one of your listed allergens. This is a soft warning — the recipe is shown but flagged.',
 'Features', true),

('Why does FoodBot not recognize some ingredients?',
 'FoodBot uses AI to extract ingredients from natural text. For best results, list ingredients clearly and separately. Unusual or brand-name ingredients may not be recognized.',
 'Troubleshooting', true),

('Why does a recipe not appear even though I have all the ingredients?',
 'Recipes are scored by how many of your ingredients they use. Active dietary preference filters may exclude certain recipes. Try clearing your filters or check if any filters conflict with the recipe.',
 'Troubleshooting', true),

('I forgot my password. What should I do?',
 'On the login page, use the Forgot password link to reset your password. You will receive a reset email. If you do not receive it, check your spam folder.',
 'Troubleshooting', true),

('Who do I contact for technical issues?',
 'If FoodBot cannot resolve your issue, use the Contact Support button that appears in the chat. You can also email support@foodbot.com directly.',
 'Contact', true),

('What is FoodBot?',
 'FoodBot is an AI-powered food assistant chatbot that recommends recipes based on ingredients you have on hand. It supports dietary filters, allergen alerts, favourites, meal planning, and shopping list generation.',
 'About', true);
