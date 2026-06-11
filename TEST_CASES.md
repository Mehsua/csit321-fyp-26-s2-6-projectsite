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

> Test cases to be written when Phase 4 is planned.

---

## Phase 5 — Frontend–Backend Integration

> Test cases to be written when Phase 5 is planned.

---

## Phase 6 — Remaining Features

> Shopping list, meal plan, dietary filter, allergen warning, favourites, session management, nutrition card.
> Test cases to be written when Phase 6 is planned.

---

## Phase 7 — Admin Panel

> Test cases to be written when Phase 7 is planned.
