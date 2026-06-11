# Codebase Reference — FYP-26-S2-6 AI Food Assistant Chatbot (FoodBot)

> This file is updated at the end of every implementation phase.
> Any new session should read this file FIRST to understand the current state of the code.
> Do NOT commit this file.

---

## Current Phase Completed
Phase 5 — Frontend Redesign

---

## Project Structure

```
/ (root)
├── frontend/                   React app (Vite)
│   ├── src/
│   │   ├── App.jsx             Full frontend (760+ lines). sendMessage stops at ingredient confirmation; runRecommend() runs after user confirms. Guest/registered status banners. Help modal. Reset chat. Score progress bar on recipe cards. RecipeModal fetches real instructions on demand. Continue as Guest on login.
│   │   ├── components/
│   │   │   └── IngredientConfirmMsg.jsx   Confirmation UI — shows extracted ingredients with Confirm/Edit buttons; local editing state; blocks recipe search until confirmed
│   │   ├── setupTests.js               Vitest setup — imports @testing-library/jest-dom, stubs scrollIntoView
│   │   └── App.test.jsx                Frontend behavioural tests (10 tests) — confirmation flow, guest banner, Continue as Guest
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
│   │   │   └── recipes.js      GET /api/recipes/:id/instructions, POST /api/recipes/recommend, GET /api/recipes/:id
│   │   ├── controllers/
│   │   │   ├── authController.js      HTTP handlers for auth routes
│   │   │   ├── sessionController.js   HTTP handler for session route
│   │   │   ├── chatController.js      HTTP handlers for /api/chat routes
│   │   │   └── recipeController.js    HTTP handlers — getInstructions, recommend, getById
│   │   ├── services/
│   │   │   ├── AuthService.js         register/login/logout/getMe + lockout logic
│   │   │   ├── SessionService.js      createGuestSession/createAuthSession
│   │   │   ├── OpenAIService.js       extractIngredients, generateCookingInstructions, chat — all use gpt-4.1-nano-2025-04-14
│   │   │   └── RecipeService.js       recommend (scoring + dietary filter + allergen flag), getById
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
│   │   │   └── 20260611000003_rls_policies_auth.sql  RLS access policies for auth-relevant tables
│   │   └── seeds/
│   │       ├── 001_seed.sql    Reference + recipe seed data
│   │       └── 002_recipe_relationships.sql   recipe_ingredients (64), recipe_dietary_tags (16), recipe_allergens (14)
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
│   │   └── recipe.search.routes.test.js  POST /recommend + GET /:id route tests (11 tests)
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
            └── 2026-06-11-phase-04-recipe-recommendation.md
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

---

## Database Schema

### Tables (20 total)

| Table | Purpose | Seeded? | Phase 2 Notes |
|---|---|---|---|
| users | User accounts — profile table only (auth managed by Supabase Auth) | No | password_hash dropped; fail_count, is_active added; timestamptz fixed |
| sessions | Chatbot + auth sessions (user_id nullable — guest sessions have NULL) | No | timestamptz fixed |
| recipes | Recipe catalogue | Yes (10 rows) | timestamptz fixed |
| ingredients | Master ingredient list | Yes (28 rows) | — |
| recipe_ingredients | Links recipes to ingredients | Yes (seed 002, 64 rows) | — |
| recipe_dietary_tags | Links recipes to dietary tags | Yes (seed 002, 16 rows) | — |
| recipe_allergens | Links recipes to allergens | Yes (seed 002, 14 rows) | — |
| nutrition_info | Calories, protein, carbs, fats, fibre per recipe | No | — |
| dietary_tags | Reference: Halal, Vegan, Vegetarian, GlutenFree | Yes (4 rows) | — |
| allergens | Reference: Peanuts, Dairy, Gluten, Shellfish, Eggs, Soy | Yes (6 rows) | — |
| user_dietary_preferences | Per-user dietary tag selections | No | — |
| user_allergens | Per-user allergen alert selections | No | — |
| user_favourites | Saved recipes per user (max 50) | No | — |
| meal_plans | Multi-day meal plan per user | No | — |
| meal_plan_items | Individual recipe slots in a meal plan | No | — |
| shopping_lists | Shopping lists per user | No | — |
| shopping_list_items | Line items in a shopping list | No | — |
| faq_entries | FAQ and guidance content | No | timestamptz fixed |
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
| `frontend/src/App.jsx` | Entire frontend — chat UI, auth pages, admin panel. Ingredient confirmation flow (extract → confirm → runRecommend). Guest/registered banners. Help modal. Reset chat. Score progress bar. RecipeModal with instruction fetch. Continue as Guest. | |
| `frontend/src/lib/api.js` | Fetch wrapper — reads JWT from localStorage, injects Authorization header | Added Phase 2 |
| `frontend/index.html` | Vite entry HTML | Title changed to "FoodBot" |
| `backend/server.js` | Express app — routes, middleware, exports app for supertest | exports `app` conditionally for test safety |
| `backend/src/services/AuthService.js` | register (admin.createUser + insert users row), login (signInWithPassword + lockout), logout, getMe | Lockout: 5 fails → 15 min lock |
| `backend/src/services/SessionService.js` | createGuestSession (user_id=null), createAuthSession (user_id=uuid) | 30-min session expiry |
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
