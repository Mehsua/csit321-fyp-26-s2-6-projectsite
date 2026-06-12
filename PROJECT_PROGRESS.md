# Project Progress — FYP-26-S2-6 AI Food Assistant Chatbot (FoodBot)

## Current Phase
Phase 10 — COMPLETE. Phase 11 (Testing) — NEXT.

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
| 6 | User Features | Favourites (DB), dietary prefs (DB), allergen profile (DB), nutrition card | COMPLETE | Full build |
| 7 | Shopping List + Session Management | Shopping list export (categorised), 30-min timeout, reset, guest mode banner | COMPLETE | Full build |
| 8 | Meal Planning | 3-day plan, perishable priority, top-up shopping list | COMPLETE | Full build |
| 9 | Customer Support | FAQ lookup, usage guidance, escalation, support_requests table | COMPLETE | Full build |
| 10 | Admin Panel | Dashboard stats, recipe CRUD, user management, error logs | COMPLETE | Full build |
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

---

## Phase 7 — Shopping List + Session Management
**Status:** COMPLETE
**Date:** 2026-06-11
**Plan file:** `docs/superpowers/plans/2026-06-11-phase-07-shopping-list-session.md`

**Goal:** Add a categorised shopping list (from recipe missing ingredients, saved to DB for registered users) and 30-minute inactivity session timeout with user notification.

**What was delivered:**
- `ShoppingListService` — generateMissingItems (case-insensitive ingredient exclusion), saveList (upsert with onConflict), getList, clearList
- Migration 005: UNIQUE(list_id, ingredient_id) + index on shopping_lists(user_id)
- `POST /api/shopping-list/generate` — optionalAuth; generates missing items, saves to DB for registered users
- `GET /api/shopping-list` — returns user's saved list (registered/admin only)
- `DELETE /api/shopping-list` — clears user's list (registered/admin only)
- `ShoppingListPage.jsx` — categorised by Produce/Dairy/Meat/Seafood/Pantry/Other; checkboxes; export/copy to clipboard; guest banner; clear all button
- `App.jsx`: addToShoppingList, clearShoppingList, session timeout useEffect (setInterval 60s, 30-min check, resettingRef guard), 🛒 topbar button, RecipeCardMsg 🛒 button, RecipeModal "🛒 Add to List" button, shopping-list page render, session expired banner
- 121 backend tests passing (was 102 before Phase 7: +10 service + 9 route)
- 21 frontend tests passing (was 18 before Phase 7: +3 new)

**Acceptance Criteria Results:**

| ID | Criterion | Result |
|---|---|---|
| P7-01 | POST /api/shopping-list/generate with valid recipeId → 200 + items array | PASS (unit test) |
| P7-02 | POST /api/shopping-list/generate without recipeId → 400 | PASS (unit test) |
| P7-03 | POST /api/shopping-list/generate guest (no auth) → does not call saveList | PASS (unit test) |
| P7-04 | POST /api/shopping-list/generate registered user → calls saveList | PASS (unit test) |
| P7-05 | GET /api/shopping-list without auth → 401 | PASS (unit test) |
| P7-06 | GET /api/shopping-list registered user → 200 + list | PASS (unit test) |
| P7-07 | DELETE /api/shopping-list without auth → 401 | PASS (unit test) |
| P7-08 | DELETE /api/shopping-list registered user → 204 | PASS (unit test) |
| P7-09 | ShoppingListService.generateMissingItems excludes session ingredients (case-insensitive) | PASS (unit test) |
| P7-10 | ShoppingListService.saveList deduplicates via UNIQUE constraint + upsert | PASS (unit test) |
| P7-11 | Frontend 🛒 topbar button navigates to ShoppingListPage | PASS (frontend test) |
| P7-12 | ShoppingListPage shows empty state "No items yet." | PASS (frontend test) |
| P7-13 | ShoppingListPage "← Back" button returns to chat | PASS (frontend test) |
| P7-14 | Session timeout: 30-min inactivity → "Session expired" banner | PASS (frontend test) |
| P7-15 | Migration 005 adds UNIQUE constraint on shopping_list_items(list_id, ingredient_id) | PENDING (manual Supabase step) |

**Pending user action:**
- [ ] Run `backend/supabase/migrations/20260611000005_shopping_list_constraints.sql` in Supabase Dashboard → SQL Editor

---

## Phase 8 — Meal Planning
**Status:** COMPLETE
**Date:** 2026-06-12
**Plan file:** `docs/superpowers/plans/2026-06-12-phase-08-meal-planning.md`

**Goal:** Add a 3-day meal plan feature that generates recipe suggestions from session ingredients, prioritises perishables for Day 1, shows per-day nutrition summaries, and lets registered users remove recipes or add individual recipes to a plan.

**What was delivered:**
- Migration 006: `meal_plans` gains `number_of_days` (replaces `week_start_date`); `meal_plan_items` gains `day_number` (replaces `day_of_week` + `meal_type`); `ingredients` gains `is_perishable` boolean
- Seed 004: 14 perishable ingredients marked (`chicken`, `beef`, `salmon`, `egg`, fresh produce, dairy)
- `MealPlanService`: `generateAndSavePlan` (scores recipes, filters to perishable-matched only, score-sorted, 2/day × numDays, nutrition_summary per day, top_up_items, DB save skipped when userId null); `getPlan`; `deletePlanItem` (404 guard with fetchError propagation); `addItemToPlan` (creates plan if none, clamps dayNumber)
- `mealPlanController.js` + `mealPlan.js` router registered at `/api/meal-plan` in `server.js`
- `MealPlanPage.jsx`: tabbed by day, recipe cards, nutrition grid, perishable banner, shopping list button
- `App.jsx`: `confirmedIngredients` state (captured in `runRecommend`), `mealPlan`/`mealPlanLoading` state, `generateMealPlan` / `deleteMealPlanItem` / `addRecipeToMealPlan` / `handleAddToShoppingListFromPlan`, 📅 topbar button, "📅 Add to Meal Plan" in RecipeModal, `meal-plan` page routing
- 140 backend tests passing (121 previous + 10 MealPlanService + 9 routes)
- 23 frontend tests passing (21 previous + 2 MealPlanPage)

**Acceptance Criteria Results:**

| ID | Criterion | Result |
|---|---|---|
| P8-01 | POST /api/meal-plan/generate with valid body → 201 + plan object | PASS (route test) |
| P8-02 | POST /api/meal-plan/generate with non-array sessionIngredients → 400 | PASS (route test) |
| P8-03 | POST /api/meal-plan/generate with numDays=5 → 400 | PASS (route test) |
| P8-04 | GET /api/meal-plan with no plan → 200 + { plan: null } | PASS (route test) |
| P8-05 | GET /api/meal-plan with existing plan → 200 + plan with days | PASS (route test) |
| P8-06 | DELETE /api/meal-plan/items/:itemId with wrong item → 404 | PASS (route test) |
| P8-07 | DELETE /api/meal-plan/items/:itemId with valid item → 204 | PASS (route test) |
| P8-08 | POST /api/meal-plan/items without recipeId → 400 | PASS (route test) |
| P8-09 | POST /api/meal-plan/items with valid body → 201 | PASS (route test) |
| P8-10 | Perishable-ingredient recipes appear in Day 1 of generated plan | PASS (service test) |
| P8-11 | MealPlanPage shows empty state with "Generate" button when plan is null | PASS (frontend test) |
| P8-12 | MealPlanPage shows recipe name, cooking time, kcal, perishable warnings | PASS (frontend test) |
| P8-13 | MealPlanPage Day 1 perishable banner shown when perishable ingredients exist | PASS (code review) |
| P8-14 | MealPlanPage "🛒 Generate Shopping List" button navigates to shopping list | PASS (code review) |
| P8-15 | 📅 topbar button visible for logged-in users, navigates to meal-plan page | PASS (code review) |
| P8-16 | RecipeModal shows "📅 Add to Meal Plan" for logged-in users | PASS (code review) |
| P8-17 | npm test (backend) → 140 tests passing | PASS |
| P8-18 | npm test (frontend) → 23 tests passing | PASS |
| P8-19 | Migration 006 applied: meal_plan_items has day_number column | PASS (user confirmed) |
| P8-20 | Seed 004 applied: ingredients.is_perishable = true for chicken, beef, salmon, egg, fresh produce | PASS (user confirmed) |

---

## Phase 9 — Customer Support
**Status:** COMPLETE
**Date:** 2026-06-12
**Plan file:** `docs/superpowers/plans/2026-06-12-phase-09-customer-support.md`

**Goal:** Add FAQ lookup from the `faq_entries` table, support request creation in `support_requests`, and frontend chat integration for support-intent detection and escalation.

**What was delivered:**
- Seed 005: 15 FAQ entries (Usage × 7, Features × 3, Troubleshooting × 3, Contact × 1, About × 1)
- `SupportService` — `queryFAQ` (keyword overlap scoring, in-memory, no API call); `createSupportRequest` (inserts into support_requests, returns contact_info)
- `POST /api/support/query` — validates message, calls queryFAQ, returns matched FAQ or matched:false (200)
- `POST /api/support/escalate` — validates message, creates support_request (user_id nullable), returns request_id + contact_info (201)
- `SupportAnswerMsg.jsx` — FAQ answer card with category label, matched/unmatched states, escalation button, confirmed state
- `App.jsx`: support keyword detection in sendMessage (before ingredient flow, skipped if message has commas); handleEscalate calls POST /api/support/escalate; support_answer message type rendered via SupportAnswerMsg
- 159 backend tests passing (140 previous + 10 SupportService + 9 routes)
- 25 frontend tests passing (23 previous + 2 SupportAnswerMsg)

**Acceptance Criteria:**

| ID | Criterion | Result |
|---|---|---|
| P9-01 | POST /api/support/query with valid message matching FAQ → 200 + matched:true + answer | PASS (route test) |
| P9-02 | POST /api/support/query with message not matching any FAQ → 200 + matched:false | PASS (route test) |
| P9-03 | POST /api/support/query with missing message → 400 | PASS (route test) |
| P9-04 | POST /api/support/escalate with valid message → 201 + request_id + contact_info | PASS (route test) |
| P9-05 | POST /api/support/escalate with missing message → 400 | PASS (route test) |
| P9-06 | POST /api/support/escalate as guest → user_id stored as null | PASS (route test) |
| P9-07 | SupportService.queryFAQ returns best keyword-overlap match from faq_entries | PASS (service test) |
| P9-08 | SupportService.queryFAQ returns matched:false on DB error | PASS (service test) |
| P9-09 | SupportService.createSupportRequest throws on DB error | PASS (service test) |
| P9-10 | SupportAnswerMsg renders question + answer when matched:true | PASS (frontend test) |
| P9-11 | SupportAnswerMsg renders escalation prompt when matched:false | PASS (frontend test) |
| P9-12 | sendMessage with 'forgot password' → calls /api/support/query before /api/chat | PASS (code review) |
| P9-13 | Comma-containing message bypasses support detection | PASS (code review) |
| P9-14 | Seed 005 applied: 15 rows in faq_entries | PENDING (manual Supabase step) |
| P9-15 | npm test (backend) → 159 tests passing | PASS |
| P9-16 | npm test (frontend) → 25 tests passing | PASS |

**Pending user action:**
- [ ] Run `backend/supabase/seeds/005_faq_seed.sql` in Supabase Dashboard → SQL Editor

---

## Phase 10 — Admin Panel
**Status:** COMPLETE
**Date:** 2026-06-12
**Plan file:** `docs/superpowers/plans/2026-06-12-phase-10-admin-panel.md`

**Goal:** Build a fully functional admin panel with Dashboard, Recipe CRUD, User Management, and Error Logs — wired to real backend APIs — replacing the stub `renderAdmin()` in App.jsx.

**What was delivered:**
- `ErrorLogService` (singleton) — `logError({ userId, errorType, message, endpoint })` inserts into error_logs; called by errorHandler for all 500 errors silently
- `errorHandler.js` updated — auto-logs 500 errors via ErrorLogService with `.catch(() => {})` guard
- `AdminService` — 15 methods: getDashboardStats (parallel Promise.all), getRecentRecipes, getRecentErrors, listRecipes (with pagination/search/category), createRecipe (ingredient upsert + tag/allergen junction links), updateRecipe, deleteRecipe (soft), listUsers, lockUser, unlockUser, deactivateUser, reactivateUser, getErrorLogs, resolveErrorLog, clearResolvedLogs
- `adminController.js` — 13 handlers with input validation (name required on create)
- `backend/src/routes/admin.js` — all routes protected by `authAdmin = [authenticate, requireRole('admin')]`; registered at `/api/admin` in server.js
- `AdminPage.jsx` — dark sidebar layout: Dashboard (4 stat cards + recent recipes/errors mini-tables with "View All" links), Recipes (table + add/edit modal with ingredient/tag/allergen/nutrition fields), Users (lock/unlock/deactivate/reactivate; admin accounts show "Protected"), Error Logs (open/resolved/total counts, status filter, resolve per-row, clear resolved)
- App.jsx — `renderAdmin()` removed, `<AdminPage>` component wired in; `adminTab`/`adminRecipes`/`editRecipe` state removed
- 189 backend tests passing (159 previous + 5 ErrorLogService + 15 AdminService + 10 admin routes)
- 27 frontend tests passing (25 previous + 2 AdminPage sidebar tests)

**Acceptance Criteria:**

| ID | Criterion | Result |
|---|---|---|
| P10-01 | GET /api/admin/dashboard returns 200 + totalRecipes, registeredUsers, activeSessions, unresolvedErrors | PASS (route test) |
| P10-02 | GET /api/admin/dashboard returns 401 without Bearer token | PASS (route test — mock auth enforced) |
| P10-03 | GET /api/admin/recipes returns 200 + recipes array + total | PASS (route test) |
| P10-04 | POST /api/admin/recipes without name → 400 | PASS (route test) |
| P10-05 | POST /api/admin/recipes with valid payload → 201 + recipe object | PASS (route test) |
| P10-06 | DELETE /api/admin/recipes/:id → 204 | PASS (route test) |
| P10-07 | GET /api/admin/users returns 200 + users array | PASS (route test) |
| P10-08 | PUT /api/admin/users/:id/lock → 200 + message | PASS (route test) |
| P10-09 | GET /api/admin/error-logs returns 200 + logs array | PASS (route test) |
| P10-10 | PUT /api/admin/error-logs/:id/resolve → 200 + message | PASS (route test) |
| P10-11 | DELETE /api/admin/error-logs/resolved → 204 | PASS (route test) |
| P10-12 | ErrorLogService.logError() inserts correct fields | PASS (service test) |
| P10-13 | getDashboardStats returns 4 counts via parallel queries | PASS (service test) |
| P10-14 | listRecipes returns paginated recipes with dietary_tags/allergens/ingredient_count | PASS (service test) |
| P10-15 | createRecipe inserts recipe + ingredient links | PASS (service test) |
| P10-16 | deleteRecipe sets is_active=false | PASS (service test) |
| P10-17 | lockUser sets is_locked=true; unlockUser resets is_locked/fail_count/lock_until | PASS (service test) |
| P10-18 | AdminPage sidebar renders Dashboard, Recipes, Users, Error Logs | PASS (frontend test) |
| P10-19 | AdminPage renders "Admin Panel" label | PASS (frontend test) |
| P10-20 | errorHandler calls errorLogService.logError for 500 errors | PASS (code review) |
| P10-21 | npm test (backend) → 189 tests passing | PASS |
| P10-22 | npm test (frontend) → 27 tests passing | PASS |
| P10-23 | npm run build (frontend) → succeeds | PASS |

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
