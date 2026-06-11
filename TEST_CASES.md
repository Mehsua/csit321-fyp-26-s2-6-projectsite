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
| P1-09 | No hardcoded credentials | CLAUDE.md — Secrets rule | No API keys, passwords, or Supabase keys are hardcoded in any source file | Code review: grep for `sk-`, `supabase.co`, `service_role`, `password` in all .js files | None found in committed source files | Grep across backend/src/ returned no matches for sk-, supabase.co, service_role, password123, admin123. | PASS | Automated: `grep -r "sk-\|supabase.co\|service_role" backend/src/` |
| P1-10 | .env not committed | CLAUDE.md — Secrets rule | Real .env files are not tracked by git | `git status` after creating .env files | `.env` files do not appear in staged or tracked files | `git check-ignore` confirms backend/.env and frontend/.env are gitignored by .gitignore lines 7-8. | PASS | Run after Task 6 (.gitignore update) |
| P1-11 | CLAUDE.md not committed | CLAUDE.md — "DO NOT COMMIT THIS FILE" | CLAUDE.md is excluded by .gitignore | `git status` | `CLAUDE.md` does not appear in staged or tracked files | `git check-ignore` confirms CLAUDE.md is gitignored by .gitignore line 43. | PASS | Run after Task 6 (.gitignore update) |

---

## Phase 2 — Authentication (Supabase Auth + JWT)

> Test cases to be written when Phase 2 is planned.

---

## Phase 3 — OpenAI API Integration

> Test cases to be written when Phase 3 is planned.

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
