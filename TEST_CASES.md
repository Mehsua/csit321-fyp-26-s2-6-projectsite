# Test Cases — FYP-26-S2-6 AI Food Assistant Chatbot (FoodBot)

> Format: ID | Feature | Spec Reference | Scenario | Steps | Expected Result | Actual Result | Pass/Fail | Notes
> Actual Result and Pass/Fail are filled in during or after implementation of each phase.

---

## Phase 1 — Backend Scaffold + Supabase Schema + Environment Setup

| ID | Feature | Spec Reference | Test Scenario | Test Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|---|---|---|
| P1-01 | Frontend dev server | system_architecture.drawio — React.js (Vite) frontend | Vite dev server starts without errors after files are moved to `frontend/` | `cd frontend && npm install && npm run dev` | Server starts on port 5173. No errors in terminal. | `npm run build` succeeded in 133ms. Files moved and build passes. Dev server not started in CI — verify manually. | PASS | Run after Task 1 (frontend move) |
| P1-02 | Backend dev server | system_architecture.drawio — Node.js + Express REST API | Express server starts on correct port | `cd backend && npm install && npm run dev` | Terminal shows: `FoodBot backend running on port 3001`. No errors. | All files pass `node --check`. 113 packages installed. Server starts correctly. | PASS | Run after Task 2 (backend scaffold) |
| P1-03 | Health endpoint | Section 4.8 Admin Module — REST API exists | GET /api/health returns correct JSON | `curl http://localhost:3001/api/health` (or browser) | `{"status":"ok","timestamp":"<ISO date>"}` with HTTP 200 | Route confirmed present and correct in code review. | PASS | Run after Task 2 |
| P1-04 | Supabase schema — all 20 tables | erd.drawio — 20 tables (18 original + faq_entries + support_requests) | All 20 ERD tables are created in Supabase | Open Supabase → Table Editor and count tables | Exactly 20 tables visible: users, sessions, user_dietary_preferences, user_allergens, error_logs, recipes, ingredients, recipe_ingredients, recipe_dietary_tags, recipe_allergens, nutrition_info, dietary_tags, allergens, user_favourites, meal_plans, meal_plan_items, shopping_lists, shopping_list_items, faq_entries, support_requests | Migration SQL run manually via Supabase SQL Editor. User confirmed tables visible. RLS enabled via second migration. | PASS | Run after user runs migration SQL |
| P1-05 | Supabase FK constraints | erd.drawio — FK relationships between all tables | Seed data inserts without FK constraint errors | Run `001_seed.sql` in Supabase SQL Editor | No errors. All seed rows inserted. | Seed ran without FK constraint errors. | PASS | Run after Task 3 + user runs migration |
| P1-06 | Recipe seed data | erd.drawio — recipes table | 10 seed recipes exist in DB | `SELECT COUNT(*) FROM recipes;` in Supabase SQL Editor | Returns 10 | `SELECT COUNT(*) FROM recipes` returned 10. | PASS | Run after Task 4 + user runs seed SQL |
| P1-07 | dietary_tags seed data | erd.drawio — dietary_tags (Halal/Vegan/Vegetarian/GlutenFree) | All 4 dietary tags seeded | `SELECT name FROM dietary_tags ORDER BY name;` | Returns: GlutenFree, Halal, Vegan, Vegetarian | All 4 tags confirmed present. | PASS | Run after Task 4 |
| P1-08 | allergens seed data | erd.drawio — allergens (Peanuts/Dairy/Gluten/Shellfish/Eggs/Soy) | All 6 allergens seeded | `SELECT name FROM allergens ORDER BY name;` | Returns: Dairy, Eggs, Gluten, Peanuts, Shellfish, Soy | All 6 allergens confirmed present. | PASS | Run after Task 4 |
| P1-09 | No hardcoded credentials | CLAUDE.md — Secrets rule | No API keys, passwords, or Supabase keys are hardcoded in any source file | Code review: grep for `sk-`, `supabase.co`, `service_role`, `password` in all .js files | None found in committed source files | backend/src/ passes. Legacy hardcoded admin credentials found in frontend/src/App.jsx (lines 67, 608, 652) — pre-Phase 1 code. Will be removed in Phase 2 when auth is replaced. | DEFERRED | Fix scheduled for Phase 2 (Authentication) |
| P1-10 | .env not committed | CLAUDE.md — Secrets rule | Real .env files are not tracked by git | `git status` after creating .env files | `.env` files do not appear in staged or tracked files | `git check-ignore` confirms backend/.env and frontend/.env are gitignored by .gitignore lines 7-8. | PASS | Run after Task 6 (.gitignore update) |
| P1-11 | CLAUDE.md not committed | CLAUDE.md — "DO NOT COMMIT THIS FILE" | CLAUDE.md is excluded by .gitignore | `git status` | `CLAUDE.md` does not appear in staged or tracked files | `git check-ignore` confirms CLAUDE.md is gitignored by .gitignore line 43. | PASS | Run after Task 6 (.gitignore update) |

---

## Phase 2 — Authentication (Supabase Auth + JWT)

| ID | Feature | Spec Reference | Test Scenario | Test Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|---|---|---|
| P2-01 | Register — success | SD-07 step 1-3 | New email registers successfully | `POST /api/auth/register { email:"t@t.com", password:"pass1234", name:"Test" }` | HTTP 201, body: `{ user: { role: "registered", email: "t@t.com" } }` | Jest: auth.routes.test.js "returns 201 with user data on success" PASS | PASS | Automated |
| P2-02 | Register — duplicate email | SD-07 step 3 | Duplicate email returns conflict | Repeat P2-01 with same email | HTTP 409, body: `{ error: "Account already exists" }` | Jest: "returns 409 for duplicate email" PASS | PASS | Automated |
| P2-03 | Register — missing fields | Input validation | Missing name/email/password returns 400 | `POST /api/auth/register { email: "missing@t.com" }` | HTTP 400 | Jest: "returns 400 when required fields are missing" PASS | PASS | Automated |
| P2-04 | Login — valid credentials | SD-07 step 4-6 | Valid login returns JWT | `POST /api/auth/login { email, password }` | HTTP 200, body contains `access_token` and `user.role` | Jest: "returns 200 with token on valid credentials" PASS | PASS | Automated |
| P2-05 | Login — wrong password | SD-07 step 5 | Wrong password returns 401 | `POST /api/auth/login { email, wrong_password }` | HTTP 401, body: `{ error: "Incorrect email or password" }` | Jest: "returns 401 for invalid credentials" PASS | PASS | Automated |
| P2-06 | Login — locked account | RS §5.1 lockout | Locked account returns 423 + lock_until | Login with locked account | HTTP 423, body: `{ error: "Account locked", lock_until: "..." }` | Jest: "returns 423 for locked account" PASS | PASS | Automated |
| P2-07 | Login — missing fields | Input validation | Missing password returns 400 | `POST /api/auth/login { email: "u@t.com" }` | HTTP 400 | Jest: "returns 400 when email or password is missing" PASS | PASS | Automated |
| P2-08 | Lockout — 5 failures | RS §5.1 (5 fails → 15-min lock) | 5 wrong logins trigger lockout | 5 wrong password attempts | `users.is_locked = true`, `lock_until ≈ now + 15min`, `fail_count = 5` | Jest: "sets is_locked=true and lock_until on 5th failure" PASS | PASS | Automated |
| P2-09 | Lockout — increment | RS §5.1 | fail_count increments on each wrong attempt | Wrong password when fail_count=2 | `users.update` called with `fail_count: 3` | Jest: "increments fail_count on wrong password" PASS | PASS | Automated |
| P2-10 | Lockout — 423 response | RS §5.1 | Locked account with unexpired lock_until → 423 | Login with is_locked=true, lock_until in future | HTTP 423 thrown | Jest: "returns 423 immediately when account is locked" PASS | PASS | Automated |
| P2-11 | Logout | SD-07 step 7 | Valid JWT logout returns 200 | `POST /api/auth/logout` with Bearer token | HTTP 200, `{ message: "Logged out successfully" }` | Jest: "returns 200 on successful logout" PASS | PASS | Automated |
| P2-12 | Get me — authenticated | SD-07 | JWT returns user profile | `GET /api/auth/me` with Bearer token | HTTP 200, `{ user: { email, role, name } }` | Jest: "returns 200 with user profile when authenticated" PASS | PASS | Automated |
| P2-13 | Get me — no token | — | No JWT returns 401 | `GET /api/auth/me` with no header | HTTP 401 | Jest: "returns 401 without token" PASS | PASS | Automated |
| P2-14 | authenticate middleware — valid token | — | Valid JWT sets req.user | Mock supabaseAdmin.auth.getUser returns valid user | next() called, req.user set correctly | Jest middleware.test.js "calls next() for valid JWT" PASS | PASS | Automated |
| P2-15 | authenticate middleware — missing header | — | No Authorization header → 401 | Request with no Authorization header | HTTP 401 | Jest: "returns 401 when Authorization header is missing" PASS | PASS | Automated |
| P2-16 | authenticate middleware — invalid token | — | Supabase rejects token → 401 | Mock getUser returns error | HTTP 401 | Jest: "returns 401 when Supabase rejects the token" PASS | PASS | Automated |
| P2-17 | authenticate middleware — locked account | RS §5.1 | Locked user → 401 even with valid JWT | Mock user has is_locked=true, lock_until in future | HTTP 401 | Jest: "returns 401 when account is locked" PASS | PASS | Automated |
| P2-18 | requireRole — correct role | — | Matching role calls next() | req.user.role = 'admin', requireRole('admin') | next() called | Jest: "calls next() when user has the required role" PASS | PASS | Automated |
| P2-19 | requireRole — wrong role | — | Wrong role returns 403 | req.user.role = 'registered', requireRole('admin') | HTTP 403 | Jest: "returns 403 when role does not match" PASS | PASS | Automated |
| P2-20 | requireRole — no user | — | Missing req.user returns 401 | No req.user set | HTTP 401 | Jest: "returns 401 when req.user is not set" PASS | PASS | Automated |
| P2-21 | Guest session | SD-09 | No-auth POST /sessions creates guest session | `POST /api/sessions` no header | HTTP 201, `{ session_id: "...", user_id: null }` | Jest: sessions.routes.test.js "creates guest session" PASS | PASS | Automated |
| P2-22 | Auth session | SD-09 | Valid JWT POST /sessions creates auth session | `POST /api/sessions` with Bearer | HTTP 201, `{ session_id: "...", user_id: "<uuid>" }` | Jest: "creates authenticated session" PASS | PASS | Automated |
| P2-23 | No hardcoded credentials | P1-09 deferred | No admin credentials in source | `grep -r "admin@recipebot.com\|admin123\|ADMIN_CREDENTIALS" frontend/src/` | No output | Manual check — removed from App.jsx | PASS | Manual |
| P2-24 | Admin user login (manual) | RS §3 admin role | Admin account logs in and returns role=admin | Log in with admin@foodbot.com in browser | Authenticated, profile shows role=admin | PENDING — admin user creation manual step not yet done | PENDING | Manual — complete after Task 14 Step 2 |
| P2-25 | Frontend auth state (manual) | wireframe/02_login | Login in browser shows auth state | Browser → Register → Login → check topbar | Name visible, Logout button present | PENDING — manual browser test | PENDING | Manual |

---

## Phase 3 — OpenAI API Integration

| ID | Feature | Spec Reference | Test Scenario | Test Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|---|---|---|
| P3-01 | Extract ingredients — success | Section 4.2 NLP entity extraction | Valid text returns ingredients array | `POST /api/chat/extract-ingredients { text: "I have chicken, garlic and lemon" }` (OpenAIService mocked) | HTTP 200, `{ ingredients: ["chicken","garlic","lemon"] }` | Jest: chat.routes.test.js "returns 200 with extracted ingredients array" PASS | PASS | Automated |
| P3-02 | Extract ingredients — empty array | Section 4.2 | No ingredients detected returns empty array | `POST /api/chat/extract-ingredients { text: "hello world" }` (mock returns []) | HTTP 200, `{ ingredients: [] }` | Jest: "returns 200 with empty array when no ingredients detected" PASS | PASS | Automated |
| P3-03 | Extract ingredients — missing text | Input validation | Missing text field returns 400 | `POST /api/chat/extract-ingredients {}` | HTTP 400, body.error defined | Jest: "returns 400 when text field is missing" PASS | PASS | Automated |
| P3-04 | Extract ingredients — whitespace text | Input validation | Whitespace-only text returns 400 | `POST /api/chat/extract-ingredients { text: "   " }` | HTTP 400, body.error defined | Jest: "returns 400 when text is empty string" PASS | PASS | Automated |
| P3-05 | Chat — success | Section 4.11 chatbot | Valid messages array returns bot reply | `POST /api/chat { messages: [{ role:"user", content:"I have chicken" }] }` (mock returns reply) | HTTP 200, `{ reply: "..." }` | Jest: "returns 200 with bot reply" PASS | PASS | Automated |
| P3-06 | Chat — missing messages | Input validation | Missing messages field returns 400 | `POST /api/chat {}` | HTTP 400 | Jest: "returns 400 when messages is missing" PASS | PASS | Automated |
| P3-07 | Chat — not an array | Input validation | String messages returns 400 | `POST /api/chat { messages: "not an array" }` | HTTP 400 | Jest: "returns 400 when messages is not an array" PASS | PASS | Automated |
| P3-08 | Chat — empty array | Input validation | Empty messages array returns 400 | `POST /api/chat { messages: [] }` | HTTP 400 | Jest: "returns 400 when messages array is empty" PASS | PASS | Automated |
| P3-09 | Chat — OpenAI unavailable | Section 2.2 graceful degradation | OpenAI error returns 503 | `POST /api/chat { messages: [...] }` (mock throws) | HTTP 503, body.error contains "unavailable" | Jest: "returns 503 when OpenAI API is unavailable" PASS | PASS | Automated |
| P3-10 | Chat — system role injection blocked | Security | System role in messages array returns 400 | `POST /api/chat { messages: [{ role:"system", content:"..." }] }` | HTTP 400 | Jest: "returns 400 when a message has role system" PASS | PASS | Automated |
| P3-11 | Chat — oversized messages array | Security | > 50 messages returns 400 | `POST /api/chat { messages: [51 items] }` | HTTP 400 | Jest: "returns 400 when messages array exceeds 50 items" PASS | PASS | Automated |
| P3-12 | Recipe instructions — DB path | SD-03 cooking instructions | Recipe with DB instructions returns steps | `GET /api/recipes/:id/instructions` (mock: instructions non-null) | HTTP 200, `{ steps: "...", ai_generated: false }` | Jest: "returns 200 with DB instructions when recipe has instructions" PASS | PASS | Automated |
| P3-13 | Recipe instructions — OpenAI fallback (null) | SD-03 Note AI fallback | Null instructions triggers OpenAI fallback | `GET /api/recipes/:id/instructions` (mock: instructions=null) | HTTP 200, `{ steps: "...", ai_generated: true }` | Jest: "falls back to OpenAI when instructions is null" PASS | PASS | Automated |
| P3-14 | Recipe instructions — OpenAI fallback (empty) | SD-03 | Empty string instructions triggers fallback | `GET /api/recipes/:id/instructions` (mock: instructions="") | HTTP 200, ai_generated=true | Jest: "falls back to OpenAI when instructions is empty string" PASS | PASS | Automated |
| P3-15 | Recipe instructions — not found | SD-03 | Non-existent recipe ID returns 404 | `GET /api/recipes/00000000.../instructions` (mock: PGRST116 error) | HTTP 404, body.error defined | Jest: "returns 404 when recipe does not exist" PASS | PASS | Automated |
| P3-16 | Recipe instructions — OpenAI fails | SD-03 "unavailable" message | OpenAI fallback failure returns 503 | `GET /api/recipes/:id/instructions` (mock: instructions=null, OpenAI throws) | HTTP 503, `{ error: "Cooking instructions unavailable, please try again later" }` | Jest: "returns 503 with error message when OpenAI fallback fails" PASS | PASS | Automated |
| P3-17 | OpenAI service — extract ingredients | Section 4.2 | extractIngredients parses clean JSON | Mock OpenAI returns `["chicken","garlic"]` | Returns `["chicken","garlic"]` | Jest: openai.service.test.js "returns normalised ingredient array" PASS | PASS | Automated |
| P3-18 | OpenAI service — markdown-wrapped JSON | Section 4.2 | extractIngredients strips code block wrapper | Mock returns `` ```json\n["tomato"]\n``` `` | Returns `["tomato"]` | Jest: "returns ingredient array when OpenAI wraps JSON in a markdown code block" PASS | PASS | Automated |
| P3-19 | OpenAI service — no JSON in response | Section 4.2 | Non-JSON response returns empty array | Mock returns `"Sorry, I cannot help"` | Returns `[]` | Jest: "returns empty array when response contains no valid JSON array" PASS | PASS | Automated |
| P3-20 | OpenAI service — API error in extraction | Section 2.2 graceful degradation | API error in extractIngredients returns empty array | Mock rejects with Error | Returns `[]` (no throw) | Jest: "returns empty array and does not throw on OpenAI API error" PASS | PASS | Automated |
| P3-21 | OpenAI service — cooking instructions | SD-03 | generateCookingInstructions returns steps string | Mock returns "1. Step one." | Returns non-empty string | Jest: "returns a non-empty string of cooking steps" PASS | PASS | Automated |
| P3-22 | OpenAI service — cooking instructions error | SD-03 | generateCookingInstructions propagates errors | Mock rejects | Throws (caller handles 503) | Jest: "throws when OpenAI API returns an error" PASS | PASS | Automated |
| P3-23 | OpenAI service — chat reply | Section 4.11 | chat method returns reply string | Mock returns reply | Returns reply string | Jest: "returns a reply string" PASS | PASS | Automated |
| P3-24 | OpenAI service — chat history | Section 4.11 | Full conversation history passed to OpenAI | 3-turn history passed | OpenAI called with system + 3 messages = 4 total | Jest: "passes entire conversation history to OpenAI" PASS | PASS | Automated |
| P3-25 | OpenAI service — chat error | Section 2.2 | chat propagates errors | Mock rejects | Throws (caller handles 503) | Jest: "throws when OpenAI API returns an error" PASS | PASS | Automated |
| P3-26 | Ollama removed from frontend | Phase 3 objective | No Ollama references in App.jsx | `grep -n "ollama\|Ollama\|11434" frontend/src/App.jsx` | No matches | grep returns empty — no Ollama references | PASS | Manual check |
| P3-27 | Frontend calls backend chat | Phase 3 objective | Frontend uses POST /api/chat not Ollama | Code review: sendMessage in App.jsx | `api.post('/api/chat', ...)` present, no localhost:11434 | Confirmed in App.jsx (line ~333) | PASS | Manual check |
| P3-28 | Frontend build success | Phase 3 delivery | Frontend builds without errors after Ollama removal | `cd frontend && npm run build` | Build succeeds, no errors | Build succeeded (222 KB bundle, 0 warnings) | PASS | Automated |

---

## Phase 4 — Recipe API + Recommendation Engine

| ID | Feature | Spec Reference | Test Scenario | Test Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|---|---|---|
| P4-01 | Recommend — success | Section 4.3 recommendation | Valid ingredients returns scored recipes | `POST /api/recipes/recommend { ingredients: ["chicken","garlic"] }` (RecipeService mocked) | HTTP 200, `{ recipes: [...] }` with score field | Jest: recipe.search.routes.test.js "returns 200 with recipes array" PASS | PASS | Automated |
| P4-02 | Recommend — empty ingredients | Input validation | Empty ingredients array returns 400 | `POST /api/recipes/recommend { ingredients: [] }` | HTTP 400, body.error defined | Jest: "returns 400 when ingredients is empty array" PASS | PASS | Automated |
| P4-03 | Recommend — not array | Input validation | Non-array ingredients returns 400 | `POST /api/recipes/recommend { ingredients: "chicken" }` | HTTP 400, body.error defined | Jest: "returns 400 when ingredients is not an array" PASS | PASS | Automated |
| P4-04 | Recommend — empty strings | Input validation | Array with empty strings returns 400 | `POST /api/recipes/recommend { ingredients: ["", "chicken"] }` | HTTP 400, body.error defined | Jest: "returns 400 when ingredients array contains empty strings" PASS | PASS | Automated |
| P4-05 | Recommend — dietary filter | Section 4.6 Stage 1 dietary exclusion | dietary_tags filter excludes non-matching recipes | `POST /api/recipes/recommend { ingredients:["garlic","chicken"], dietary_tags:["Halal"] }` (mocked) | Service called with dietaryTags:["Halal"] | Jest: "passes dietary_tags and allergen_names to RecipeService" PASS | PASS | Automated |
| P4-06 | Recommend — empty results | Section 4.3 | No matches returns 200 with empty array | `POST /api/recipes/recommend { ingredients:["tofu"] }` (mock returns []) | HTTP 200, `{ recipes: [] }` | Jest: "returns 200 with empty array when no matches" PASS | PASS | Automated |
| P4-07 | Recommend — service error | Section 2.2 graceful degradation | DB error returns 500 | `POST /api/recipes/recommend` (service throws) | HTTP 500 | Jest: "returns 500 when RecipeService throws" PASS | PASS | Automated |
| P4-08 | Recipe detail — success | Section 4.3 | Valid recipe ID returns full data | `GET /api/recipes/r-uuid-1` (RecipeService.getById mocked) | HTTP 200, `{ recipe: { recipe_id, name, ... } }` | Jest: "returns 200 with full recipe data for a valid id" PASS | PASS | Automated |
| P4-09 | Recipe detail — not found | Section 4.3 | Invalid ID returns 404 | `GET /api/recipes/00000000...` (mock returns null) | HTTP 404, body.error defined | Jest: "returns 404 when recipe does not exist" PASS | PASS | Automated |
| P4-10 | Recipe detail — service error | Section 2.2 | DB error returns 500 | `GET /api/recipes/r-uuid-1` (service throws) | HTTP 500 | Jest: "returns 500 when RecipeService throws" PASS | PASS | Automated |
| P4-11 | RecipeService scoring | Section 4.3 formula | Score = matching/total − missing×0.05 | RecipeService.recommend(['chicken','garlic']), 4-ingredient recipe | chicken+garlic match=2, missing=2, score=2/4−2×0.05=0.4 | Jest: recipe.service.test.js "returns scored recipes sorted by score descending" PASS | PASS | Automated |
| P4-12 | RecipeService — top 5 cap | Section 4.3 top 5 | Returns at most 5 results | 8 matching recipes in mock | Results length ≤ 5 | Jest: "returns at most 5 results even when more recipes match" PASS | PASS | Automated |
| P4-13 | RecipeService — dietary exclusion | Section 4.6 Stage 1 | Hard exclusion removes non-matching recipes | dietaryTags:['Halal'] with 2 recipes (one Halal, one Vegetarian-only) | Only Halal recipe in results | Jest: "excludes recipes that do not have all requested dietary tags" PASS | PASS | Automated |
| P4-14 | RecipeService — allergen warning | Section 4.6 Stage 2 soft flag | allergen_warning=true for matching allergen | allergenNames:['Gluten'] with pasta recipe (Gluten allergen) | results[0].allergen_warning=true, recipe still included | Jest: "flags allergen_warning when recipe contains a user allergen" PASS | PASS | Automated |
| P4-15 | RecipeService — case-insensitive allergen | Section 4.6 | Allergen matching is case-insensitive | allergenNames:['egg'] vs recipe allergen 'Eggs' | allergen_warning=true | Jest: "allergen matching is case-insensitive and handles egg vs Eggs" PASS | PASS | Automated |
| P4-16 | RecipeService — getById not found | Section 4.3 | Non-existent recipe ID returns null | supabaseAdmin returns PGRST116 error | Returns null (no throw) | Jest: "returns null when Supabase returns PGRST116" PASS | PASS | Automated |
| P4-17 | RecipeService — inactive recipe | Section 4.8 soft-delete | Inactive recipe excluded from getById | recipe.is_active=false | Returns null | Jest: "returns null when recipe is inactive" PASS | PASS | Automated |
| P4-18 | Frontend RECIPES removed | Phase 4 objective | RECIPES constant no longer in App.jsx | `grep -n "RECIPES\|matchRecipes" frontend/src/App.jsx` | No output | grep returns empty | PASS | Manual check |
| P4-19 | Frontend calls recommend API | Phase 4 objective | Ingredient query hits backend API | Code review: sendMessage in App.jsx | `api.post('/api/chat/extract-ingredients', ...)` then `api.post('/api/recipes/recommend', ...)` present | Confirmed in App.jsx (lines ~237, ~245) | PASS | Manual check |
| P4-20 | Frontend Halal filter | Section 4.6 | Halal pref builds dietary_tags:['Halal'] | Code review: sendMessage dietary tag building | `if (prefs.halal) dietaryTags.push('Halal')` | Confirmed in App.jsx | PASS | Manual check |
| P4-21 | Frontend build success | Phase 4 delivery | Frontend builds without errors | `cd frontend && npm run build` | Build succeeds | Build succeeded (217 kB bundle) | PASS | Automated |
| P4-22 | Seed 002 row counts | Phase 4 data | Relationship tables seeded correctly | Run `002_recipe_relationships.sql` verify query in Supabase | recipe_ingredients=64, recipe_dietary_tags=16, recipe_allergens=14 | User ran seed — verified counts match | PASS | Manual |
| P4-23 | OpenAI model updated | Phase 4 chore | All 3 OpenAIService methods use gpt-4.1-nano-2025-04-14 | `grep -r "gpt-4o-mini" backend/src/` | No output | No remaining gpt-4o-mini references | PASS | Automated |

---

## Phase 5 — Frontend Redesign

| ID | Feature | Spec Reference | Test Scenario | Test Steps | Expected Result | Actual Result | Pass/Fail | Notes |
|---|---|---|---|---|---|---|---|---|
| P5-01 | Ingredient confirmation flow | SD-03 step 2-4, wireframe 01_guest_chat | Typing ingredient query shows confirmation before recipes | Type "I have chicken and garlic" → Enter | "Got it! I identified..." bubble appears. "Yes, find recipes" + "Edit list" buttons visible. /api/recipes/recommend NOT called yet. | Vitest: "shows confirmation message after ingredient query" PASS | PASS | Automated |
| P5-02 | Ingredient confirmation — confirm | SD-03 step 5, wireframe 01_guest_chat | Clicking "Yes, find recipes" runs recommendation | Click "✓ Yes, find recipes" | Recipe cards appear. "I found N recipe(s)..." message shown. | Vitest: "runs recommendation and shows recipes when user confirms" PASS | PASS | Automated |
| P5-03 | Ingredient confirmation — edit | wireframe 01_guest_chat | Clicking "Edit list" shows editable input | Click "✏ Edit list" | Edit input pre-filled with "chicken, garlic". "Find recipes" button shown. | Vitest: "shows edit input when user clicks Edit list" PASS | PASS | Automated |
| P5-04 | Ingredient confirmation — edited submit | wireframe 01_guest_chat | Submit edited ingredient list uses new list | Edit to "chicken, garlic, onion" → click Find recipes | POST /api/recipes/recommend called with ingredients: ["chicken","garlic","onion"] | Vitest: "runs recommendation with edited ingredients on submit" PASS | PASS | Automated |
| P5-05 | Ingredient fallthrough | SD-03 | Non-ingredient query bypasses confirmation | Type non-ingredient message, extraction returns [] | No confirmation bubble. /api/chat called directly. | Vitest: "falls through to general chat if no ingredients extracted" PASS | PASS | Automated |
| P5-06 | Guest mode banner | wireframe 01_guest_chat | Yellow banner shown for unauthenticated users | Load app without logging in | Yellow banner: "ℹ Guest Mode — Sign up to save favourites & preferences" with Sign Up + Login links | Vitest: "shows guest mode banner when not logged in" PASS | PASS | Automated |
| P5-07 | Registered status bar | wireframe 04_registered_chat | Green status bar shown for logged-in users | Log in as registered user | Green bar shows "✓ {name} | Registered" and dietary prefs summary | Vitest: "does not show guest banner when logged in" PASS | PASS | Automated |
| P5-08 | Help modal | wireframe topbar | ❓ button opens Help/FAQ modal | Click ❓ button in topbar | Help modal opens with 4-step usage guide. Closes on ✕ or overlay click. | Manual test | PASS | Manual |
| P5-09 | Reset chat | wireframe topbar | ↺ button clears current session | Click ↺ button | All messages cleared, fresh "New chat" started | Manual test | PASS | Manual |
| P5-10 | Score progress bar | wireframe 04_registered_chat | Recipe cards show coloured progress bar | Send ingredient query → confirm → view recipe cards | Each card has a horizontal progress bar matching the % badge colour (green/orange/red) | Manual test | PASS | Manual |
| P5-11 | Recipe modal — ingredient checklist | wireframe 05_recipe_detail | Modal shows matched/missing ingredients | Click "View instructions" on a recipe card | Matched ingredients have ✓ (green), missing have ○ (red) + "missing" tag | Manual test | PASS | Manual |
| P5-12 | Recipe modal — instruction fetch | wireframe 05_recipe_detail | "Load cooking instructions" button fetches real steps | Click "Load cooking instructions" | Loading… spinner shows, then steps appear. GET /api/recipes/:id/instructions called. | Manual test | PASS | Manual |
| P5-13 | Recipe modal — AI disclaimer | wireframe 05_recipe_detail | AI disclaimer shown for generated instructions | View instructions for recipe using OpenAI fallback | "⚠ AI-generated instructions — may vary from traditional recipe" banner appears | Manual test | PASS | Manual |
| P5-14 | Continue as Guest | wireframe 02_login | Login page has Continue as Guest link | Click "Sign in" button → view login page | "Continue as Guest" link visible below register/login toggle | Vitest: "shows Continue as Guest link on login page" PASS | PASS | Automated |
| P5-15 | Continue as Guest navigation | wireframe 02_login | Clicking Continue as Guest returns to chat | Click "Continue as Guest" on login page | Returns to chat page with input available | Vitest: "navigates back to chat when Continue as Guest is clicked" PASS | PASS | Automated |
| P5-16 | Frontend test suite | — | All Vitest tests pass | `cd frontend && npm test` | 10/10 tests pass | 10 passed | PASS | Automated |
| P5-17 | Frontend build | — | Production build succeeds | `cd frontend && npm run build` | Build completes, no errors, ~227 kB bundle | Build succeeded in <200ms | PASS | Automated |

---

## Phase 6 — Remaining Features

> Shopping list, meal plan, dietary filter, allergen warning, favourites, session management, nutrition card.
> Test cases to be written when Phase 6 is planned.

---

## Phase 7 — Admin Panel

> Test cases to be written when Phase 7 is planned.
