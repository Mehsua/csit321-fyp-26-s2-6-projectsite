# Codebase Reference — FYP-26-S2-6 AI Food Assistant Chatbot (FoodBot)

> This file is updated at the end of every implementation phase.
> Any new session should read this file FIRST to understand the current state of the code.
> Do NOT commit this file.

---

## Current Phase Completed
Phase 9 — Customer Support

---

## Project Structure

```
/ (root)
├── frontend/                   React app (Vite)
│   ├── src/
│   │   ├── App.jsx             Full frontend (760+ lines). sendMessage stops at ingredient confirmation; runRecommend() runs after user confirms. Guest/registered status banners. Help modal. Reset chat. Score progress bar on recipe cards. RecipeModal fetches real instructions on demand. Continue as Guest on login.
│   │   ├── components/
│   │   │   ├── IngredientConfirmMsg.jsx   Confirmation UI — shows extracted ingredients with Confirm/Edit buttons; local editing state; blocks recipe search until confirmed
│   │   │   ├── ShoppingListPage.jsx        Shopping list page — categorised items with checkboxes, export, guest banner, clear all
│   │   │   ├── MealPlanPage.jsx            Meal plan page — tabbed by day, recipe cards with perishable warnings, nutrition summary, remove and shopping list buttons
│   │   │   └── SupportAnswerMsg.jsx   FAQ answer card — shows question/answer when matched, escalation button, confirmed state
│   │   ├── setupTests.js               Vitest setup — imports @testing-library/jest-dom, stubs scrollIntoView
│   │   └── App.test.jsx                Frontend behavioural tests (23 tests) — confirmation flow, guest banner, Continue as Guest, MealPlanPage empty state and recipe render
│   │   ├── lib/
│   │   │   └── api.js          Fetch wrapper — injects Authorization: Bearer from localStorage
│   │   ├── index.css           Global reset styles
│   │   └── main.jsx            React entry point
│   ├── public/                 Static assets
│   ├── index.html              Vite entry HTML — title: FoodBot
│   ├── vite.config.js          /api proxy to localhost:3001
│   └── package.json            Frontend deps: React 19, Vite 8, Vitest 4 (name: foodbot)
├── backend/                    Node.js + Express REST API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── health.js       GET /api/health
│   │   │   ├── auth.js         POST /register, POST /login, POST /logout, GET /me
│   │   │   ├── sessions.js     POST /api/sessions (optionalAuth)
│   │   │   ├── chat.js         POST /api/chat, POST /api/chat/extract-ingredients
│   │   │   ├── recipes.js      GET /api/recipes/:id/instructions, POST /api/recipes/recommend, GET /api/recipes/:id
│   │   │   ├── shoppingList.js     POST /api/shopping-list/generate (optionalAuth), GET / (auth), DELETE / (auth)
│   │   │   ├── mealPlan.js         POST /generate, GET /, DELETE /items/:itemId, POST /items (all registered/admin auth)
│   │   │   └── support.js          POST /query, POST /escalate (both optionalAuth)
│   │   ├── controllers/
│   │   │   ├── authController.js      HTTP handlers for auth routes
│   │   │   ├── sessionController.js   HTTP handler for session route
│   │   │   ├── chatController.js      HTTP handlers for /api/chat routes
│   │   │   ├── recipeController.js    HTTP handlers — getInstructions, recommend, getById
│   │   │   ├── shoppingListController.js  generate, getList, clearList handlers
│   │   │   ├── mealPlanController.js  generate, getPlan, deletePlanItem, addItem handlers
│   │   │   └── supportController.js  query, escalate handlers
│   │   ├── services/
│   │   │   ├── AuthService.js         register/login/logout/getMe + lockout logic
│   │   │   ├── SessionService.js      createGuestSession/createAuthSession
│   │   │   ├── OpenAIService.js       extractIngredients, generateCookingInstructions, chat — all use gpt-4.1-nano-2025-04-14
│   │   │   ├── RecipeService.js       recommend (scoring + dietary filter + allergen flag), getById
│   │   │   ├── ShoppingListService.js     generateMissingItems, saveList, getList, clearList
│   │   │   ├── MealPlanService.js         generateAndSavePlan, getPlan, deletePlanItem, addItemToPlan
│   │   │   └── SupportService.js     queryFAQ (keyword overlap scoring), createSupportRequest
│   │   ├── db/
│   │   │   └── supabase.js     Supabase dual-client (supabase=anon, supabaseAdmin=service role)
│   │   └── middleware/
│   │       ├── authenticate.js   JWT → req.user (validates via supabaseAdmin.auth.getUser)
│   │       ├── requireRole.js    Role guard factory: requireRole('admin') or requireRole(['admin','registered'])
│   │       └── errorHandler.js   Global Express error handler
│   ├── supabase/
│   │   ├── migrations/
│   │   │   ├── 20260611000000_initial_schema.sql   20-table schema
│   │   │   ├── 20260611000001_enable_rls.sql       RLS enabled on all tables
│   │   │   ├── 20260611000002_auth_additions.sql   Drop password_hash; add fail_count, is_active; fix timestamptz
│   │   │   ├── 20260611000003_rls_policies_auth.sql  RLS access policies for auth-relevant tables
│   │   │   ├── 20260611000004_favourites_score.sql  Adds score column to user_favourites
│   │   │   ├── 20260611000005_shopping_list_constraints.sql  UNIQUE(list_id, ingredient_id) + index on shopping_lists(user_id)
│   │   │   └── 20260611000006_meal_plan_schema_fix.sql  meal_plans gets number_of_days; meal_plan_items gets day_number; ingredients gets is_perishable
│   │   └── seeds/
│   │       ├── 001_seed.sql    Reference + recipe seed data
│   │       ├── 002_recipe_relationships.sql   recipe_ingredients (64), recipe_dietary_tags (16), recipe_allergens (14)
│   │       ├── 003_nutrition_seed.sql   nutrition_info for all 10 recipes
│   │       ├── 004_perishable_seed.sql  is_perishable=true for 14 ingredients (chicken, beef, salmon, egg, fresh produce, dairy)
│   │       └── 005_faq_seed.sql   15 FAQ entries (Usage, Features, Troubleshooting, Contact, About)
│   ├── tests/
│   │   ├── setup.js                    Jest env var mocks (includes OPENAI_API_KEY mock)
│   │   ├── auth.service.test.js        AuthService unit tests (9 tests)
│   │   ├── middleware.test.js           authenticate + requireRole tests (8 tests)
│   │   ├── auth.routes.test.js         Auth route integration tests (8 tests)
│   │   ├── sessions.routes.test.js     Sessions route integration tests (2 tests)
│   │   ├── openai.service.test.js      OpenAIService unit tests (9 tests)
│   │   ├── chat.routes.test.js         Chat route integration tests (11 tests)
│   │   ├── recipe.routes.test.js       Recipe instructions route tests (5 tests)
│   │   ├── recipe.service.test.js      RecipeService unit tests (14 tests)
│   │   ├── recipe.search.routes.test.js  POST /recommend + GET /:id route tests (11 tests)
│   │   ├── user.service.test.js          UserService unit tests (10 tests)
│   │   ├── user.routes.test.js           User route integration tests (13 tests)
│   │   ├── shopping-list.service.test.js   ShoppingListService unit tests (10 tests)
│   │   ├── shopping-list.routes.test.js    Shopping list route integration tests (9 tests)
│   │   ├── meal-plan.service.test.js       MealPlanService unit tests (10 tests)
│   │   ├── meal-plan.routes.test.js        Meal plan route integration tests (9 tests)
│   ├── support.service.test.js    SupportService unit tests (10 tests)
│   └── support.routes.test.js    Support route integration tests (9 tests)
│   ├── server.js               Express entry point — exports app for testing
│   ├── package.json            jest + supertest in devDependencies; test script configured
│   └── .env.example            Required env var template (commit this)
├── .gitignore                  Covers .env, node_modules, CLAUDE.md, PROJECT_PROGRESS.md
├── README.md                   Setup instructions
├── CLAUDE.md                   Project rules (do not commit)
├── PROJECT_PROGRESS.md         Phase tracking (do not commit)
├── CODEBASE.md                 This file (do not commit)
├── TEST_CASES.md               Test case log
└── docs/
    ├── plans/
    │   ├── phase-01-backend-scaffold.md
    │   ├── phase-02-authentication.md
    │   └── phase-03-openai-integration.md
    └── superpowers/
        └── plans/
            ├── 2026-06-11-phase-03-openai-integration.md
            ├── 2026-06-11-phase-04-recipe-recommendation.md
            ├── 2026-06-11-phase-05-frontend-redesign.md
            ├── 2026-06-11-phase-06-user-features.md
            ├── 2026-06-11-phase-07-shopping-list-session.md
            └── 2026-06-12-phase-08-meal-planning.md
```

---

## How to Run

```bash
# Install
cd frontend && npm install
cd ../backend && npm install

# Set up env vars (fill in real values)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test

# Run dev servers (two terminals)
cd backend && npm run dev     # http://localhost:3001
cd frontend && npm run dev    # http://localhost:5173
```

---

## Environment Variables

| Variable | File | Purpose | Required from Phase |
|---|---|---|---|
| `SUPABASE_URL` | `backend/.env` | Supabase project URL | Phase 1+ |
| `SUPABASE_ANON_KEY` | `backend/.env` | Anon key — used by signInWithPassword in AuthService | Phase 2+ |
| `SUPABASE_SERVICE_KEY` | `backend/.env` | Service role key — bypasses RLS for admin ops | Phase 1+ |
| `OPENAI_API_KEY` | `backend/.env` | OpenAI API key — required for all three OpenAIService methods | Phase 3+ |
| `ALLOWED_ORIGINS` | `backend/.env` | CORS allowlist (comma-separated) | Optional (default: localhost:5173) |
| `SESSION_SECRET` | `backend/.env` | Express session secret | Phase 2+ |
| `PORT` | `backend/.env` | Backend port | Optional (default: 3001) |
| `VITE_SUPABASE_URL` | `frontend/.env` | Supabase URL (unused in Phase 2 — backend proxies) | Phase 2+ |
| `VITE_SUPABASE_ANON_KEY` | `frontend/.env` | Anon key (unused in Phase 2) | Phase 2+ |
| `VITE_API_BASE_URL` | `frontend/.env` | Backend base URL | Phase 2+ |
| `SUPPORT_EMAIL` | `backend/.env` | Support contact email returned on escalation | Phase 9 (optional, default: support@foodbot.com) |

---

## Backend API Endpoints

| Method | Path | Auth Required | Description | Added in Phase |
|---|---|---|---|---|
| GET | /api/health | No | Returns `{ status: "ok", timestamp }` | Phase 1 |
| POST | /api/auth/register | No | Create new registered user. Body: `{ email, password, name }`. Returns `{ user }` (201) or 409 duplicate | Phase 2 |
| POST | /api/auth/login | No | Sign in. Body: `{ email, password }`. Returns `{ access_token, user }` (200), 401 wrong creds, 423 locked | Phase 2 |
| POST | /api/auth/logout | Yes (Bearer) | Mark active sessions inactive. Returns `{ message }` (200) | Phase 2 |
| GET | /api/auth/me | Yes (Bearer) | Returns current user profile `{ user }` (200) | Phase 2 |
| POST | /api/sessions | Optional (Bearer) | Creates guest session (user_id=null) or auth session. Returns `{ session_id, user_id, ... }` (201) | Phase 2 |
| POST | /api/chat/extract-ingredients | No | Extract ingredient names from text via OpenAI NLP. Body: `{ text }`. Returns `{ ingredients: string[] }`. Returns 400 on missing/empty text. | Phase 3 |
| POST | /api/chat | No | General chatbot reply via OpenAI. Body: `{ messages: [{role, content}] }` (max 50 messages, role must be user/assistant). Returns `{ reply: string }`. Returns 503 if OpenAI unavailable. | Phase 3 |
| GET | /api/recipes/:id/instructions | No | Get cooking steps for a recipe. DB-first; falls back to OpenAI generation if instructions null/empty. Returns `{ steps, ai_generated: boolean }`. Returns 404 if recipe not found, 503 if OpenAI fails. | Phase 3 |
| POST | /api/recipes/recommend | No | Recommend top 5 recipes. Body: `{ ingredients: string[], dietary_tags?: string[], allergen_names?: string[] }`. Returns `{ recipes: RecipeResult[] }`. 400 on missing/invalid ingredients. | Phase 4 |
| GET | /api/recipes/:id | No | Full recipe detail. Returns `{ recipe }`. 404 if not found or inactive. | Phase 4 |
| GET | /api/users/me/preferences | Yes (registered/admin) | Returns `{ dietaryTags: string[], allergenNames: string[] }` | Phase 6 |
| PUT | /api/users/me/preferences | Yes (registered/admin) | Body: `{ dietaryTags: string[], allergenNames: string[] }`. Returns `{ message }`. 400 if non-array. | Phase 6 |
| GET | /api/users/me/favourites | Yes (registered/admin) | Returns `{ count, remaining, favourites[] }` | Phase 6 |
| POST | /api/users/me/favourites | Yes (registered/admin) | Body: `{ recipeId, score? }`. Returns 201. 400 if missing recipeId. 409 if duplicate or limit reached. | Phase 6 |
| DELETE | /api/users/me/favourites/:recipeId | Yes (registered/admin) | Removes saved recipe. Returns 204. | Phase 6 |
| POST | /api/shopping-list/generate | Optional (Bearer) | Generate missing-ingredient list for a recipe. Body: `{ recipeId, sessionIngredients?: string[] }`. Returns `{ items: ShoppingItem[] }`. Saves to DB for registered users. 400 on missing recipeId or non-array sessionIngredients. | Phase 7 |
| GET | /api/shopping-list | Yes (registered/admin) | Returns user's saved shopping list. Returns `{ list_id, items[] }`. | Phase 7 |
| DELETE | /api/shopping-list | Yes (registered/admin) | Clears user's shopping list. Returns 204. | Phase 7 |
| POST | /api/meal-plan/generate | Yes (registered/admin) | Generate + save 3-day meal plan. Body: `{ sessionIngredients?: string[], numDays?: 1-3 }`. Returns plan with days, nutrition summaries, top_up_items. 400 if non-array or numDays out of range. | Phase 8 |
| GET | /api/meal-plan | Yes (registered/admin) | Returns user's latest meal plan `{ plan }` (null if none). | Phase 8 |
| DELETE | /api/meal-plan/items/:itemId | Yes (registered/admin) | Removes a recipe from the meal plan. Returns 204. 404 if item not found or not owned by user. | Phase 8 |
| POST | /api/meal-plan/items | Yes (registered/admin) | Adds a single recipe to current plan (creates plan if none). Body: `{ recipeId, dayNumber? }`. Returns 201 `{ plan_id }`. 400 if recipeId missing. | Phase 8 |
| POST | /api/support/query | Optional (Bearer) | Check user message against FAQ entries. Body: `{ message }`. Returns `{ matched: boolean, question?, answer?, category?, faq_id? }`. 400 on missing/empty message. | Phase 9 |
| POST | /api/support/escalate | Optional (Bearer) | Create a support request and return contact info. Body: `{ message }`. Returns `{ request_id, contact_info }` (201). 400 on missing message. | Phase 9 |

---

## Services and Classes

| Service | File | Responsibilities | Added in Phase |
|---|---|---|---|
| Supabase anon client | `backend/src/db/supabase.js` → `supabase` | RLS-scoped queries (currently unused in Phase 2) | Phase 1 |
| Supabase admin client | `backend/src/db/supabase.js` → `supabaseAdmin` | All auth + DB ops (bypasses RLS) | Phase 1 |
| AuthService | `backend/src/services/AuthService.js` | register, login, logout, getMe. Lockout: 5 fails → 15-min lock tracked in users.fail_count/is_locked/lock_until | Phase 2 |
| SessionService | `backend/src/services/SessionService.js` | createGuestSession (user_id=null), createAuthSession (user_id=<uuid>). 30-min expiry. | Phase 2 |
| authenticate middleware | `backend/src/middleware/authenticate.js` | Validates Bearer JWT via supabaseAdmin.auth.getUser, loads user row, sets req.user | Phase 2 |
| requireRole middleware | `backend/src/middleware/requireRole.js` | Factory: requireRole('admin') returns middleware that 401s if no user, 403s if wrong role | Phase 2 |
| Error handler | `backend/src/middleware/errorHandler.js` | Global Express error middleware, JSON responses | Phase 1 |
| OpenAIService | `backend/src/services/OpenAIService.js` | `extractIngredients(text)` → string[] (returns [] on error); `generateCookingInstructions(recipeName)` → string (throws on error, safeName sanitised); `chat(messages)` → string (throws on error). All use gpt-4.1-nano-2025-04-14 (changed from gpt-4o-mini in Phase 4). | Phase 3 |
| RecipeService | `backend/src/services/RecipeService.js` | `recommend({ ingredients, dietaryTags, allergenNames })` → RecipeResult[] (max 5, sorted by score desc). `getById(recipeId)` → recipe or null. Score = matchingCount/total − missingCount×0.05, clamped to 0. Dietary: hard exclusion. Allergen: soft flag. | Phase 4 |
| UserService | `backend/src/services/UserService.js` | `getPreferences(userId)` → {dietaryTags, allergenNames}; `setPreferences(userId, {dietaryTags, allergenNames})`; `getFavourites(userId)` → {count, remaining, favourites}; `addFavourite(userId, recipeId, score?)` — throws 409 on limit/duplicate; `removeFavourite(userId, recipeId)` | Phase 6 |
| ShoppingListService | `backend/src/services/ShoppingListService.js` | `generateMissingItems(recipeId, sessionIngredients)` → ShoppingItem[]; `saveList(userId, items)` → listId; `getList(userId)` → {list_id, items}; `clearList(userId)`. Deduplicates via DB UNIQUE constraint + upsert. | Phase 7 |
| MealPlanService | `backend/src/services/MealPlanService.js` | `generateAndSavePlan(userId, sessionIngredients, numDays)` → plan (scores recipes, perishable-first sort, 2/day × numDays, nutrition summaries, top_up_items; skips DB when userId null); `getPlan(userId)` → plan or null; `deletePlanItem(userId, itemId)` → void (throws {status:404} if not found/owned); `addItemToPlan(userId, recipeId, dayNumber)` → planId (creates plan if none). | Phase 8 |
| SupportService | `backend/src/services/SupportService.js` | `queryFAQ(message)` — fetches all active faq_entries, scores by keyword overlap (words > 3 chars, not stop words), returns best match or `{ matched: false }`; `createSupportRequest(userId, message)` — inserts into support_requests (user_id nullable for guests), returns `{ request_id, contact_info }` | Phase 9 |

---

## Database Schema

### Tables (20 total)

| Table | Purpose | Seeded? | Phase 2 Notes |
|---|---|---|---|
| users | User accounts — profile table only (auth managed by Supabase Auth) | No | password_hash dropped; fail_count, is_active added; timestamptz fixed |
| sessions | Chatbot + auth sessions (user_id nullable — guest sessions have NULL) | No | timestamptz fixed |
| recipes | Recipe catalogue | Yes (10 rows) | timestamptz fixed |
| ingredients | Master ingredient list — includes is_perishable boolean flag (migration 006 + seed 004) | Yes (28 rows + Phase 8 perishable flags) | is_perishable added Phase 8 |
| recipe_ingredients | Links recipes to ingredients | Yes (seed 002, 64 rows) | — |
| recipe_dietary_tags | Links recipes to dietary tags | Yes (seed 002, 16 rows) | — |
| recipe_allergens | Links recipes to allergens | Yes (seed 002, 14 rows) | — |
| nutrition_info | Calories, protein, carbs, fats, fibre per recipe | Yes (10 rows, seed 003) | — |
| dietary_tags | Reference: Halal, Vegan, Vegetarian, GlutenFree | Yes (4 rows) | — |
| allergens | Reference: Peanuts, Dairy, Gluten, Shellfish, Eggs, Soy | Yes (6 rows) | — |
| user_dietary_preferences | Per-user dietary tag selections | No | — |
| user_allergens | Per-user allergen alert selections | No | — |
| user_favourites | Saved recipes per user (max 50) | No | — |
| meal_plans | Multi-day meal plan per user. Stores number_of_days (1-3). | No | week_start_date replaced with number_of_days in migration 006 |
| meal_plan_items | Recipe slots in a plan. day_number (1-3) identifies the day. | No | day_of_week + meal_type replaced with day_number in migration 006 |
| shopping_lists | Shopping lists per user | No | index on user_id added Phase 7 |
| shopping_list_items | Line items in a shopping list | No | UNIQUE(list_id, ingredient_id) added Phase 7 |
| faq_entries | FAQ and guidance content | Yes (15 rows, seed 005) | timestamptz fixed; seeded Phase 9 |
| support_requests | Escalated user issues | No | timestamptz fixed |
| error_logs | Application error log (admin-viewable) | No | timestamptz fixed |

**RLS:** Enabled on all 20 tables. Phase 2 added policies:
- `users`: authenticated read own row
- `sessions`: authenticated read/update own sessions
- `user_dietary_preferences`, `user_allergens`, `user_favourites`: authenticated own rows only
- `recipes`, `ingredients`, `dietary_tags`, `allergens`, `faq_entries`: public read
- All other tables: no direct client access (backend service role only)

---

## Key Files and What They Do

| File | What it does | Notes |
|---|---|---|
| `frontend/src/App.jsx` | Entire frontend — chat UI, auth pages, admin panel. Ingredient confirmation flow (extract → confirm → runRecommend). Guest/registered banners. Help modal. Reset chat. Score progress bar. RecipeModal with instruction fetch. Continue as Guest. Session timeout (30-min). Shopping list. Meal plan (📅 topbar, generateMealPlan, deleteMealPlanItem, addRecipeToMealPlan, handleAddToShoppingListFromPlan). confirmedIngredients state captured in runRecommend. | |
| `frontend/src/components/ShoppingListPage.jsx` | Shopping list page — categorised by Produce/Dairy/Meat/Seafood/Pantry/Other; checkboxes; export/copy to clipboard; guest banner; clear all button | Added Phase 7 |
| `frontend/src/components/MealPlanPage.jsx` | Meal plan page — tabbed by day (Day 1/2/3), recipe cards with cooking time / kcal / perishable warnings / remove button, per-day nutrition grid, perishable banner on Day 1, shopping list button | Added Phase 8 |
| `frontend/src/lib/api.js` | Fetch wrapper — reads JWT from localStorage, injects Authorization header | Added Phase 2 |
| `frontend/index.html` | Vite entry HTML | Title changed to "FoodBot" |
| `backend/server.js` | Express app — routes, middleware, exports app for supertest | exports `app` conditionally for test safety |
| `backend/src/services/AuthService.js` | register (admin.createUser + insert users row), login (signInWithPassword + lockout), logout, getMe | Lockout: 5 fails → 15 min lock |
| `backend/src/services/SessionService.js` | createGuestSession (user_id=null), createAuthSession (user_id=uuid) | 30-min session expiry |
| `backend/src/services/ShoppingListService.js` | generateMissingItems, saveList (upsert with onConflict), getList, clearList | Added Phase 7 |
| `backend/src/controllers/shoppingListController.js` | generate (optionalAuth: saves for registered), getList, clearList | Added Phase 7 |
| `backend/src/routes/shoppingList.js` | POST /generate (inline optionalAuth), GET / + DELETE / (requireRole registered/admin) | Added Phase 7 |
| `backend/src/services/MealPlanService.js` | generateAndSavePlan (score + perishable sort + 2/day × numDays + top_up_items), getPlan, deletePlanItem, addItemToPlan | Added Phase 8 |
| `backend/src/controllers/mealPlanController.js` | generate, getPlan, deletePlanItem, addItem — service instantiated per-handler | Added Phase 8 |
| `backend/src/routes/mealPlan.js` | POST /generate, GET /, DELETE /items/:itemId, POST /items — all require registered/admin | Added Phase 8 |
| `backend/src/middleware/authenticate.js` | JWT validation: getUser → load public.users row → set req.user | Returns 401 if token invalid, user inactive, or locked |
| `backend/src/middleware/requireRole.js` | Role guard: requireRole('admin') or requireRole(['admin','registered']) | 401 if no req.user, 403 if role mismatch |
| `backend/tests/setup.js` | Sets dummy env vars for Jest so supabase.js doesn't throw on import | Required for all test files |

---

## Implementation Decisions

| Decision | Phase | Reason |
|---|---|---|
| Dual Supabase clients (anon + service role) | Phase 1 | Service role bypasses RLS — using it for all queries is a security risk |
| CORS restricted via ALLOWED_ORIGINS env var | Phase 1 | Wildcard CORS exposes API to any origin in production |
| Migration files use Supabase timestamp format | Phase 1 | Enables `npx supabase db push` for reproducible team setup |
| RLS enabled immediately with no policies | Phase 1 | Safe default — blocks Data API access until Phase 2 adds explicit policies |
| signInWithPassword via anon client (not service role) | Phase 2 | Service role key doesn't authenticate as the user — anon client required for password sign-in |
| admin.createUser with email_confirm: true | Phase 2 | Bypasses email confirmation requirement for registration — simpler dev/demo flow |
| JWT stored in localStorage | Phase 2 | Simplest for Phase 2. Harden to httpOnly cookie in Phase 12 (deployment) |
| Lockout tracked in public.users (not Supabase Auth) | Phase 2 | Supabase Auth has no built-in lockout enforcement — custom fail_count + is_locked columns |
| server.js exports app conditionally | Phase 2 | `require.main === module` guard lets supertest import app without starting a listener |

---

## Known Issues / TODOs Carried Forward

| Issue | Severity | Phase it should be fixed | Notes |
|---|---|---|---|
| Note | recipe_ingredients / recipe_dietary_tags / recipe_allergens seeded in 002 — user must run seed manually in Supabase SQL Editor | — | — |
| sessions_insert_guest RLS policy not in migration 003 | Low | — | All session creation uses service role (bypasses RLS) — no functional impact |
| Logout does not revoke Supabase JWT | High | Phase 12 (hardening) | sessions.is_active is cleared but the JWT remains valid until natural expiry (~1 hr). Acceptable for demo. Fix: supabase.auth.admin.signOut at deployment hardening phase. |
| fail_count lockout is a non-atomic read-modify-write | High | Phase 12 (hardening) | Concurrent failed logins could under-count. Needs a Postgres RPC for atomic increment. Negligible risk at demo scale. |
| JWT stored in localStorage | Low | Phase 12 (hardening) | Readable by XSS. Will move to httpOnly cookie at deployment phase. |

---

## Phase Update Log

| Phase | Date | What changed in this file |
|---|---|---|
| Phase 0 | 2026-06-11 | Initial template created. Baseline recorded. |
| Phase 1 | 2026-06-11 | frontend/+backend/ split, Express scaffold, Supabase schema (20 tables, RLS), seed data, env templates. |
| Phase 2 | 2026-06-11 | Auth routes, AuthService, SessionService, authenticate/requireRole middleware. 27 backend tests passing. Frontend wired to backend auth. FoodBot branding applied. Hardcoded credentials removed. optionalAuth fixed (expired token falls back to guest). Error messages de-leaked. |
| Phase 3 | 2026-06-11 | OpenAIService (extractIngredients, generateCookingInstructions, chat). POST /api/chat/extract-ingredients + POST /api/chat routes with message validation. GET /api/recipes/:id/instructions with DB-first / OpenAI-fallback. Frontend askOllama() removed, chat wired to backend. 52 backend tests passing. |
| Phase 4 | 2026-06-11 | RecipeService added. POST /api/recipes/recommend + GET /api/recipes/:id routes added. Frontend RECIPES array and matchRecipes() removed; wired to backend. Seed 002 created. OpenAI model updated to gpt-4.1-nano-2025-04-14. 79 tests passing. |
| Phase 5 | 2026-06-11 | IngredientConfirmMsg component. sendMessage refactored to stop at confirmation; runRecommend() added. Guest + registered status banners. Help modal + Reset chat. Score progress bar on recipe cards. RecipeModal: ingredient checklist + on-demand instruction fetch + AI disclaimer. Login: Continue as Guest. package.json renamed to foodbot. Vitest + @testing-library/react setup. 10 frontend tests passing. |
| Phase 6 | 2026-06-11 | UserService (getPreferences, setPreferences, getFavourites, addFavourite, removeFavourite). userController + /api/users/me/* routes. nutrition_info seeded (10 rows). user_favourites.score column added. Frontend: adaptRecipe normalises nutrition field names; prefs+favs loaded from API on auth/login; saveToFavourites/removeFavourite wired to API; Save Preferences button on profile page; ♡ Favourites topbar button + Favourites page; RecipeModal ♡ Save button. 102 backend tests + 18 frontend tests passing. |
| Phase 7 | 2026-06-11 | ShoppingListService (generate, save, get, clear). Shopping list routes (POST /generate, GET, DELETE). ShoppingListPage component. App.jsx: addToShoppingList, clearShoppingList, session timeout (30-min inactivity → banner → reset), 🛒 topbar button, RecipeCardMsg 🛒 button, RecipeModal "🛒 Add to List". 121 backend tests + 21 frontend tests passing. |
| Phase 8 | 2026-06-12 | Migration 006 (meal_plan schema fix + ingredients.is_perishable). Seed 004 (14 perishable ingredients). MealPlanService (generateAndSavePlan — perishable-only filter + score sort, 2/day × numDays, top_up_items, nutrition_summary; getPlan; deletePlanItem with 404 guard; addItemToPlan). mealPlanController + mealPlan.js routes registered at /api/meal-plan. MealPlanPage.jsx component. App.jsx: confirmedIngredients state (captured in runRecommend), mealPlan/mealPlanLoading state, generateMealPlan/deleteMealPlanItem/addRecipeToMealPlan/handleAddToShoppingListFromPlan functions, 📅 topbar button, "📅 Add to Meal Plan" in RecipeModal, meal-plan page routing. 140 backend tests + 23 frontend tests passing. |
| Phase 9 | 2026-06-12 | SupportService (queryFAQ, createSupportRequest). Support routes (POST /query, POST /escalate). SupportAnswerMsg component. sendMessage support detection. handleEscalate. Seed 005 (15 FAQ entries). 159 backend tests + 25 frontend tests passing. |
