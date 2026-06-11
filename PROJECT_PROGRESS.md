# Project Progress — FYP-26-S2-6 AI Food Assistant Chatbot (FoodBot)

## Current Phase
Phase 5 — COMPLETE. Phase 6 (User Features: Favourites, Dietary Prefs, Allergen Profile, Nutrition Card) — NEXT.

---

## High-Level Phase Roadmap

| Phase | Name | Goal | Status | Priority |
|---|---|---|---|---|
| 0 | Discovery + Gap Assessment | Understand codebase vs design spec, establish baseline | COMPLETE | — |
| 1 | Backend Scaffold + Supabase Schema | frontend/backend split, Express scaffold, 20-table DB, env setup | COMPLETE | Week 11 demo |
| 2 | Authentication | Supabase Auth, JWT, register/login/logout, lockout, guest sessions | COMPLETE | Week 11 demo |
| 3 | OpenAI API Integration | Replace Llama with OpenAI, NLP ingredient extraction, cooking instruction fallback | COMPLETE | Week 11 demo |
| 4 | Recipe API + Recommendation Engine | Recipe CRUD endpoints, match scoring (top 5), dietary filter, allergen check | COMPLETE | Week 11 demo |
| 5 | Frontend Redesign | FoodBot branding, ingredient confirmation flow, wireframe-matching UI, connect to backend | COMPLETE | Week 11 demo |
| 6 | User Features | Favourites (DB), dietary prefs (DB), allergen profile (DB), nutrition card | PENDING | Full build |
| 7 | Shopping List + Session Management | Shopping list export (categorised), 30-min timeout, reset, guest mode banner | PENDING | Full build |
| 8 | Meal Planning | 3-day plan, perishable priority, top-up shopping list | PENDING | Full build |
| 9 | Customer Support | FAQ lookup, usage guidance, escalation, support_requests table | PENDING | Full build |
| 10 | Admin Panel | Dashboard stats, recipe CRUD, user management, error logs | PENDING | Full build |
| 11 | Testing | Unit tests, integration tests, test case log (Sprint Testing format) | PENDING | Submission |
| 12 | Deployment | Vercel (frontend), Render (backend), environment variable setup on platforms | PENDING | Submission |

**Note on 3-agent workflow per phase:**
- One Implementation Agent (Sonnet) runs all tasks in the phase sequentially
- One Agent 2 (Haiku) verifies requirements against the plan + design spec after all tasks complete
- One Agent 3 (Opus) checks code quality, security, and regressions after all tasks complete
- 3 total agent calls per phase — not per task

---

## Completed Phases

### Phase 0 — Discovery and Gap Assessment
**Status:** COMPLETE
**Date:** 2026-06-11

**What was done:**
- Cloned GitHub repo (Mehsua/csit321-fyp-26-s2-6-recipebot)
- Read all 13 wireframes (01_guest_chat through 13_admin_error_logs)
- Read all 11 sequence diagram files (SD-01 through SD-11)
- Read ERD (`diagrams/erd.drawio`) — 18 original tables
- Added `faq_entries` and `support_requests` to ERD — now 20 tables
- Read system architecture diagram (`diagrams/system_architecture.drawio`)
- Read `build_docx.py` — full design spec content extracted
- Established current app baseline (see below)
- Produced gap assessment table
- Produced traceability matrix
- Created `CLAUDE.md` (do not commit)
- Created `PROJECT_PROGRESS.md` (this file — do not commit)
- Created `TEST_CASES.md`
- Converted design spec to Markdown: `C:\Users\Benjamin\FYP\DesignSpec\DesignSpecification_FYP-26-S2-6.md`
- Created Phase 1 plan: `docs/plans/phase-01-backend-scaffold.md`

**Files inspected:**
- `src/App.jsx` (765 lines — entire app in one file)
- `package.json` (frontend only, Vite + React)
- `.gitignore`
- All 13 wireframe HTML files
- `diagrams/erd.drawio`
- `diagrams/system_architecture.drawio`
- All SD drawio files + SD-11 JPG image

**Files changed in Phase 0:** None in `src/` (discovery only)
**Files created in Phase 0:** `CLAUDE.md`, `PROJECT_PROGRESS.md`, `TEST_CASES.md`, `docs/plans/phase-01-backend-scaffold.md`

---

## Current App Baseline (recorded 2026-06-11)

| Command | Result |
|---|---|
| `npm install` | ✓ Succeeds. 0 vulnerabilities. |
| `npm run build` | ✓ Succeeds. Builds in 194ms. Output: 222.85 kB JS, 0.11 kB CSS. |
| `npm run dev` | ✓ Starts Vite dev server (requires Ollama running for AI responses) |
| `npm test` | ✗ Fails — "Missing script: test". No test runner configured. Zero tests exist. |
| Ollama/Llama 3.2 | Required locally (`ollama serve`) — falls back to hardcoded responses if offline |

**Key baseline findings:**
- Single-file React app (`src/App.jsx`, 765 lines) — entire app in one file
- Uses Llama 3.2 via local Ollama — must be replaced with OpenAI API
- No backend, no database, no real authentication
- All recipe data is hardcoded in a constant array (10 recipes)
- Admin credentials hardcoded in source: `admin@recipebot.com / admin123` — SECURITY RISK
- App display name is "RecipeBot" — wireframes require "FoodBot"
- Returns top 3 recipes — design spec requires top 5
- No ingredient confirmation step (extract → confirm → search)
- Favourites, dietary prefs, allergens stored in memory only — lost on refresh
- No tests, no .env, no deployment config, no backend, no DB schema

---

## Phase 3 — OpenAI API Integration
**Status:** COMPLETE
**Date:** 2026-06-11
**Plan file:** `docs/superpowers/plans/2026-06-11-phase-03-openai-integration.md`

**Goal:** Replace Ollama/Llama with OpenAI API for ingredient extraction, general chatbot responses, and cooking instruction fallback. Wire frontend to backend instead of Ollama.

**What was delivered:**
- `OpenAIService` — extractIngredients (returns [] on error), generateCookingInstructions (throws on error, recipe name sanitised), chat (throws on error). All use gpt-4o-mini.
- `POST /api/chat/extract-ingredients` — validates text, calls OpenAIService.extractIngredients
- `POST /api/chat` — validates messages array (max 50, role user/assistant only, content ≤ 2000 chars), calls OpenAIService.chat, returns 503 on AI failure
- `GET /api/recipes/:id/instructions` — DB-first, OpenAI fallback, returns `{ steps, ai_generated }`, 404 on missing recipe, 503 on OpenAI failure, PGRST116 vs other DB errors distinguished
- Frontend: askOllama() removed, ollamaOnline state removed, chat wired to POST /api/chat with 20-message rolling window and 2000-char context guard
- 52 backend tests passing (27 original + 25 new)

**Acceptance Criteria Results:**

| ID | Criterion | Result |
|---|---|---|
| P3-01 | POST /api/chat/extract-ingredients with valid text → 200 + ingredients array | PASS (unit test) |
| P3-02 | POST /api/chat/extract-ingredients with empty text → 400 | PASS (unit test) |
| P3-03 | POST /api/chat with valid messages → 200 + reply string | PASS (unit test) |
| P3-04 | POST /api/chat with empty messages → 400 | PASS (unit test) |
| P3-05 | POST /api/chat when OpenAI unavailable → 503 | PASS (unit test) |
| P3-06 | POST /api/chat with role=system in messages → 400 (injection blocked) | PASS (unit test) |
| P3-07 | POST /api/chat with >50 messages → 400 | PASS (unit test) |
| P3-08 | GET /api/recipes/:id/instructions recipe has DB instructions → 200 + ai_generated=false | PASS (unit test) |
| P3-09 | GET /api/recipes/:id/instructions instructions null → OpenAI fallback → ai_generated=true | PASS (unit test) |
| P3-10 | GET /api/recipes/:id/instructions recipe not found → 404 | PASS (unit test) |
| P3-11 | GET /api/recipes/:id/instructions OpenAI fails → 503 + exact error message | PASS (unit test) |
| P3-12 | askOllama() removed from frontend — no Ollama references in App.jsx | PASS (grep check) |
| P3-13 | Frontend chat calls POST /api/chat (not localhost:11434) | PASS (grep check) |
| P3-14 | Frontend build succeeds with no errors | PASS (npm run build) |

---

## Phase 4 — Recipe API + Recommendation Engine
**Status:** COMPLETE
**Date:** 2026-06-11
**Plan file:** `docs/superpowers/plans/2026-06-11-phase-04-recipe-recommendation.md`

**Goal:** Replace the in-memory `matchRecipes()` function in the frontend with a real backend recommendation engine: extract ingredients via OpenAI NLP, score recipes from Supabase against the ingredient list, apply dietary filters (hard exclusion) and allergen flags (soft warning), return the top 5 matches.

**What was delivered:**
- OpenAI model updated from gpt-4o-mini to gpt-4.1-nano-2025-04-14 across all 3 service methods
- Seed 002 created for recipe_ingredients (64 rows), recipe_dietary_tags (16 rows), recipe_allergens (14 rows)
- `RecipeService` — recommend() with scoring algorithm (matchingCount/total − missingCount×0.05), hard dietary exclusion, soft allergen flag, top 5 cap; getById()
- `POST /api/recipes/recommend` — validates ingredients (non-empty array of strings), passes dietary_tags + allergen_names through, returns { recipes }
- `GET /api/recipes/:id` — returns { recipe } or 404
- Frontend: RECIPES constant and matchRecipes() removed; adaptRecipe() adapter added; sendMessage wired to backend extract-ingredients → recommend pipeline
- 79 backend tests passing (was 52 after Phase 3: +14 RecipeService + 11 route + 2 extra quality tests)

**Acceptance Criteria Results:**

| ID | Criterion | Result |
|---|---|---|
| P4-01 | POST /api/recipes/recommend with valid ingredients → 200 + recipes array | PASS (unit test) |
| P4-02 | POST /api/recipes/recommend with empty ingredients → 400 | PASS (unit test) |
| P4-03 | POST /api/recipes/recommend with non-string ingredients → 400 | PASS (unit test) |
| P4-04 | POST /api/recipes/recommend with dietary_tags → excludes non-matching recipes | PASS (unit test) |
| P4-05 | POST /api/recipes/recommend with allergen_names → flags matching recipes | PASS (unit test) |
| P4-06 | POST /api/recipes/recommend → returns at most 5 results | PASS (unit test) |
| P4-07 | POST /api/recipes/recommend → score = matching/total − missing×0.05, clamped 0 | PASS (unit test) |
| P4-08 | GET /api/recipes/:id with valid id → 200 + full recipe data | PASS (unit test) |
| P4-09 | GET /api/recipes/:id with invalid id → 404 | PASS (unit test) |
| P4-10 | Frontend: no RECIPES constant or matchRecipes() in App.jsx | PASS (grep check) |
| P4-11 | Frontend: ingredient query calls POST /api/chat/extract-ingredients then POST /api/recipes/recommend | PASS (code review) |
| P4-12 | Frontend: Halal filter builds dietary_tags: ['Halal'] in recommend request | PASS (code review) |
| P4-13 | Frontend build succeeds with no errors | PASS (npm run build — 217 kB bundle) |
| P4-14 | Seed 002 rows: recipe_ingredients=64, recipe_dietary_tags=16, recipe_allergens=14 | PASS (SQL verify in Supabase) |
| P4-15 | OpenAI model updated to gpt-4.1-nano-2025-04-14, 52 existing tests still pass | PASS (npm test) |

---

## Phase 5 — Frontend Redesign
**Status:** COMPLETE
**Date:** 2026-06-11
**Plan file:** `docs/superpowers/plans/2026-06-11-phase-05-frontend-redesign.md`

**Goal:** Rebuild the FoodBot frontend UI to match the design spec wireframes: add ingredient confirmation flow, guest/registered banners, Help/Reset topbar, score progress bar on recipe cards, real instructions in recipe modal, and Continue as Guest on login page.

**What was delivered:**
- `IngredientConfirmMsg.jsx` component — 3 states: unconfirmed (Confirm/Edit), editing (editable input), confirmed (✓)
- `sendMessage` refactored: stops at ingredient confirmation (inserts `ingredient_confirm` message, returns early); does NOT call recommend yet
- `runRecommend(ingredients, confirmMsgId)` — marks confirm message confirmed, then calls POST /api/recipes/recommend
- Stable message IDs (Date.now()) prevent stale index issues; double-tap guards prevent duplicate API calls
- Guest mode yellow banner: "ℹ Guest Mode — Sign up to save favourites & preferences" with Sign Up/Login links
- Registered green status bar: user name, role, dietary prefs summary
- ❓ Help modal with 4-step FoodBot usage guide
- ↺ Reset chat button clears all sessions
- Score progress bar on recipe cards (green ≥70%, orange ≥40%, red <40%)
- RecipeModal: ingredient checklist (matched ✓ / missing ○), nutrition grid, on-demand instruction fetch (GET /api/recipes/:id/instructions), AI-generated disclaimer
- "Continue as Guest" link on login page → navigates to chat
- Vitest + @testing-library/react installed; 10 behavioural tests passing
- `frontend/package.json` renamed to "foodbot"

**Acceptance Criteria Results:**

| ID | Criterion | Result |
|---|---|---|
| P5-01 | Typing ingredient query → confirmation message before recipes | PASS |
| P5-02 | Clicking "✓ Yes, find recipes" → recommendation runs, recipe cards appear | PASS |
| P5-03 | Clicking "✏ Edit list" → edit input pre-filled | PASS |
| P5-04 | Editing and submitting → recommend uses edited list | PASS |
| P5-05 | Non-ingredient question → no confirmation, direct /api/chat reply | PASS |
| P5-06 | Guest user → yellow banner visible | PASS |
| P5-07 | Logged-in user → green status bar with name, role, dietary prefs | PASS |
| P5-08 | ❓ button → Help modal opens | PASS |
| P5-09 | ↺ button → chat cleared and reset | PASS |
| P5-10 | Recipe card → score progress bar visible | PASS |
| P5-11 | Recipe modal → matched ✓ green, missing ○ red | PASS |
| P5-12 | Recipe modal → "Load cooking instructions" fetches GET /api/recipes/:id/instructions | PASS |
| P5-13 | Recipe modal → AI disclaimer shown if ai_generated=true | PASS |
| P5-14 | Login page → "Continue as Guest" link visible | PASS |
| P5-15 | npm test (frontend) → 10/10 tests pass | PASS |
| P5-16 | npm run build (frontend) → succeeds | PASS |

---

## Phase 2 — Authentication (Supabase Auth + JWT)
**Status:** COMPLETE
**Date:** 2026-06-11
**Plan file:** `docs/plans/phase-02-authentication.md`

**Goal:** Supabase Auth, JWT register/login/logout, account lockout (5 attempts → 15 min), guest sessions, role-based access.

**What was delivered:**
- `AuthService` — register (admin.createUser + public.users insert), login (signInWithPassword + lockout), logout, getMe
- `SessionService` — createGuestSession (user_id=null, 30-min expiry), createAuthSession (user_id=uuid)
- `authenticate` middleware — JWT → req.user via supabaseAdmin.auth.getUser
- `requireRole` middleware — role-based access factory
- Auth routes: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- Session route: POST /api/sessions (optionalAuth)
- Migrations 002 (schema fixes) + 003 (RLS policies) added
- Jest + Supertest test infrastructure — 26 tests, all passing
- Frontend api.js fetch wrapper with JWT injection
- Frontend App.jsx: hardcoded credentials removed, register/login/logout wired to backend, JWT restore on mount, guest session on load
- FoodBot branding (index.html, App.jsx — RecipeBot → FoodBot)
- Top 5 recipes (was top 3)

**Pending user action:**
- [ ] Create admin user in Supabase Dashboard (Task 14 Step 2 — manual steps in plan file)

**Acceptance Criteria Results:**

| ID | Criterion | Result |
|---|---|---|
| P2-01 | POST /register → 201 + role=registered | PASS (unit test) |
| P2-02 | POST /register duplicate email → 409 | PASS (unit test) |
| P2-03 | POST /login valid creds → 200 + access_token | PASS (unit test) |
| P2-04 | POST /login wrong password → 401 | PASS (unit test) |
| P2-05 | 5 failed logins → is_locked=true, lock_until set | PASS (unit test) |
| P2-06 | Locked account → 423 + lock_until | PASS (unit test) |
| P2-07 | POST /logout → 200 | PASS (unit test) |
| P2-08 | GET /me with JWT → 200 + user profile | PASS (unit test) |
| P2-09 | GET /me without JWT → 401 | PASS (unit test) |
| P2-10 | POST /sessions no auth → 201 + user_id=null | PASS (unit test) |
| P2-11 | POST /sessions with JWT → 201 + user_id set | PASS (unit test) |
| P2-12 | Admin user can login → role=admin | PENDING (admin user not yet created) |
| P2-13 | No hardcoded credentials in frontend/src/ | PASS (manual check) |
| P2-14 | Registered user on admin-only route → 403 | PASS (requireRole unit test) |
| P2-15 | Frontend shows auth state after login | PENDING (manual browser test) |

---

## Phase 1 — Backend Scaffold + Supabase Schema + Environment Setup
**Status:** COMPLETE
**Date:** 2026-06-11
**Plan file:** `docs/plans/phase-01-backend-scaffold.md`

**Goal:** Establish correct foundational architecture. No auth, no AI, no frontend feature changes.

**Scope:**
- Move existing React files into `frontend/` folder
- Create `backend/` with Node.js + Express scaffold
- Write full Supabase migration SQL (20 ERD tables)
- Write seed SQL (dietary_tags, allergens, ingredients, 10 recipes)
- Create `backend/.env.example` and `frontend/.env.example`
- Update `.gitignore` to cover all .env files
- Update `README.md` with setup instructions
- Add `/api/health` endpoint

**Acceptance Criteria:**
| ID | Criterion |
|---|---|
| P1-01 | `cd frontend && npm run dev` starts on port 5173 without errors |
| P1-02 | `cd backend && npm run dev` starts on port 3001 without errors |
| P1-03 | `GET http://localhost:3001/api/health` returns `{"status":"ok","timestamp":"..."}` |
| P1-04 | All 20 Supabase tables visible in Supabase table editor |
| P1-05 | Seed SQL runs without FK constraint errors |
| P1-06 | `SELECT COUNT(*) FROM recipes` returns 10 |
| P1-07 | `SELECT name FROM dietary_tags` returns Halal, Vegan, Vegetarian, GlutenFree |
| P1-08 | `SELECT name FROM allergens` returns Peanuts, Dairy, Gluten, Shellfish, Eggs, Soy |
| P1-09 | No hardcoded credentials in any source file |
| P1-10 | `.env` files not committed (`git status` clean) |
| P1-11 | `CLAUDE.md` not committed (`git status` clean) |

**Test cases:** See `TEST_CASES.md` — P1-01 through P1-11

**Rollback:** All changes are additive (new files + file moves). Reverse with `git mv` and delete `backend/`. No existing code deleted.

---

## Decision Log

| Decision | Reason | Spec Reference | User Approved | Date |
|---|---|---|---|---|
| App display name = "FoodBot" | All wireframes use "FoodBot" — current code says "RecipeBot" | wireframes/01, 02, 04, 10 | Yes | 2026-06-11 |
| Replace Llama/Ollama with OpenAI API | Design spec and system architecture specify OpenAI API | system_architecture.drawio, Section 3.2 | Yes | 2026-06-11 |
| Build Node.js + Express backend | System architecture requires Application Layer with Express REST API | system_architecture.drawio | Yes | 2026-06-11 |
| Use Supabase PostgreSQL + Auth | System architecture requires Data Layer with Supabase | system_architecture.drawio, erd.drawio | Yes | 2026-06-11 |
| frontend/ + backend/ folder split | Design spec deploys frontend to Vercel, backend to Render — separate folders required | system_architecture.drawio | Yes | 2026-06-11 |
| External service setup = manual steps | User manages external accounts (Supabase, OpenAI, Vercel, Render) | CLAUDE.md | Yes | 2026-06-11 |
| CLAUDE.md and PROJECT_PROGRESS.md not committed | Internal dev files — not part of codebase | CLAUDE.md | Yes | 2026-06-11 |
| ERD has 20 tables (not 17 as previously stated) | Recount from erd.drawio: 18 original + faq_entries + support_requests = 20 | erd.drawio | Yes | 2026-06-11 |
| Supabase project not yet created | User will create manually when ready for Phase 1 | — | Pending | 2026-06-11 |
| OpenAI API key not yet available | User will obtain when ready for Phase 3 | — | Pending | 2026-06-11 |

---

## Unclear Spec Items — Status

| Item | Status | Resolution |
|---|---|---|
| Does the .docx contain requirements not in wireframes/diagrams? | Resolved | Full docx converted to MD — all content extracted from build_docx.py |
| App name "FoodBot" vs "RecipeBot"? | Resolved | Confirmed "FoodBot" by user |
| `recipes.source = enum(db/ai)` — design intent? | Resolved | "db" = instructions from database; "ai" = OpenAI-generated fallback (confirmed in Section 4.5.12) |
| `sessions` table — chatbot or auth sessions? | Resolved | Both — `user_id` is nullable (guest sessions have NULL user_id, registered sessions are linked) |
| `recipe_ingredients` has quantity/unit — required in seed? | Pending | Seed data does not include quantities (uses NULL). Confirm if demo requires quantities. |
| SD-04 steps 6 and 7 label "cooking steps" in a dietary filtering diagram | Resolved | User confirmed labels are correct as-is |
| faq_entries and support_requests missing from original ERD | Resolved | Both tables added to erd.drawio |
| Meal plan: "3 days" in text vs "week_start_date" in ERD | Resolved | Follow design spec text: up to 3 days, structured by day_number |

---

## Known Issues in Current Code (pre-Phase 1)

| Severity | Issue |
|---|---|
| CRITICAL | Hardcoded admin credentials in `src/App.jsx`: `admin@recipebot.com / admin123` |
| CRITICAL | Uses Llama 3.2 via local Ollama instead of OpenAI API |
| CRITICAL | No backend, no database, no real authentication |
| CRITICAL | No sessions table — session data lost on refresh |
| High | App display name "RecipeBot" must become "FoodBot" |
| High | Returns top 3 recipes — spec requires top 5 |
| High | No ingredient extraction confirmation step |
| High | Favourites, dietary prefs, allergens in-memory only |
| High | No tests — zero test coverage |
| High | No .env — no environment variable management |
| Medium | No deployment config (Vercel/Render) |
| Medium | No score progress bar on recipe cards (wireframe requires it) |
| Medium | No Help/FAQ button in topbar |
| Medium | No Reset Chat button in topbar |
| Medium | No guest mode banner |
| Low | No recipe image placeholder |

---

## Pending User Actions (before Phase 1 can complete)

All completed ✅
1. ✅ Created Supabase project and provided URL + keys
2. ✅ Ran `backend/supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor
3. ✅ Ran `backend/supabase/seeds/001_seed.sql` in Supabase SQL Editor
4. ✅ Created `backend/.env` from `backend/.env.example`
5. ✅ Created `frontend/.env` from `frontend/.env.example`
