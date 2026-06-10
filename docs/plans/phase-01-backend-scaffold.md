# Phase 1 Implementation Plan — Backend Scaffold + Supabase Schema + Environment Setup

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the repo into `frontend/` + `backend/`, scaffold the Node.js + Express backend, produce the full Supabase schema SQL (20 tables) and seed SQL, and set up environment variable templates. No auth, no OpenAI, no frontend feature changes in this phase.

**Architecture:** Three-tier — React (Vite) frontend → Express REST API backend → Supabase PostgreSQL. This phase establishes the skeleton only; no business logic is implemented.

**Tech Stack:** Node.js 18+, Express 4.x, @supabase/supabase-js 2.x, dotenv, cors, helmet, morgan, nodemon (dev)

**Design Spec References:**
- ERD (20 tables): `C:\Users\Benjamin\FYP\DesignSpec\diagrams\erd.drawio`
- System architecture: `C:\Users\Benjamin\FYP\DesignSpec\diagrams\system_architecture.drawio`
- Design spec Markdown: `C:\Users\Benjamin\FYP\DesignSpec\DesignSpecification_FYP-26-S2-6.md`
- Project rules: `C:\Users\Benjamin\FYP\repo\CLAUDE.md`
- Progress tracking: `C:\Users\Benjamin\FYP\repo\PROJECT_PROGRESS.md`

---

## Files Allowed to Create or Modify

| Action | File |
|---|---|
| Move | `src/` → `frontend/src/` |
| Move | `public/` → `frontend/public/` |
| Move | `index.html` → `frontend/index.html` |
| Move | `vite.config.js` → `frontend/vite.config.js` |
| Move | `package.json` → `frontend/package.json` |
| Move | `package-lock.json` → `frontend/package-lock.json` |
| Move | `eslint.config.js` → `frontend/eslint.config.js` |
| Modify | `frontend/vite.config.js` — add proxy |
| Create | `backend/package.json` |
| Create | `backend/server.js` |
| Create | `backend/src/routes/health.js` |
| Create | `backend/src/db/supabase.js` |
| Create | `backend/src/middleware/errorHandler.js` |
| Create | `backend/supabase/migrations/001_initial_schema.sql` |
| Create | `backend/supabase/seeds/001_seed.sql` |
| Create | `backend/.env.example` |
| Create | `frontend/.env.example` |
| Create | `docs/plans/` (this folder) |
| Modify | `.gitignore` |
| Modify | `README.md` |
| Modify | `PROJECT_PROGRESS.md` |
| Modify | `TEST_CASES.md` |

## Files NOT to Touch

| File | Reason |
|---|---|
| `frontend/src/App.jsx` | Frontend feature changes are a later phase |
| `frontend/src/index.css` | No UI changes this phase |
| `frontend/src/main.jsx` | No UI changes this phase |
| `projectsite/` | Separate project site — leave alone |
| `CLAUDE.md` | Project rules — do not modify |

---

## IMPORTANT: External Service Setup — Manual Steps Required

**Do NOT set up Supabase programmatically.** Give the user these steps and wait for confirmation.

### Step A — Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**, name it `fyp-26-s2-6-foodbot`
3. Set a strong database password and save it
4. Select nearest region (e.g. Singapore)
5. Wait ~2 minutes for the project to be ready
6. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY` (backend only — keep secret)

### Step B — Run migration SQL
After Task 3 creates the migration file:
1. Go to your Supabase project → **SQL Editor**
2. Paste the full contents of `backend/supabase/migrations/001_initial_schema.sql`
3. Click **Run** — confirm no errors

### Step C — Run seed SQL
After Task 4 creates the seed file:
1. Go to Supabase → **SQL Editor**
2. Paste the full contents of `backend/supabase/seeds/001_seed.sql`
3. Click **Run** — confirm no errors

### Step D — Create .env files
After Tasks 5 and 6 create .env.example files:

Create `backend/.env`:
```
SUPABASE_URL=<your project URL>
SUPABASE_SERVICE_KEY=<your service_role key>
OPENAI_API_KEY=sk-placeholder-for-now
SESSION_SECRET=any-long-random-string-here
PORT=3001
```

Create `frontend/.env`:
```
VITE_SUPABASE_URL=<your project URL>
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_API_BASE_URL=http://localhost:3001
```

---

## Task 1 — Move React files into `frontend/`

**Files:**
- Move: `src/` → `frontend/src/`
- Move: `public/` → `frontend/public/`
- Move: `index.html` → `frontend/index.html`
- Move: `vite.config.js` → `frontend/vite.config.js`
- Move: `package.json` → `frontend/package.json`
- Move: `package-lock.json` → `frontend/package-lock.json`
- Move: `eslint.config.js` → `frontend/eslint.config.js`
- Modify: `frontend/vite.config.js`

- [ ] **Step 1: Move files using git mv**

```bash
git mv src frontend/src
git mv public frontend/public
git mv index.html frontend/index.html
git mv vite.config.js frontend/vite.config.js
git mv package.json frontend/package.json
git mv package-lock.json frontend/package-lock.json
git mv eslint.config.js frontend/eslint.config.js
```

- [ ] **Step 2: Add Vite proxy to `frontend/vite.config.js`**

Read the current content of `frontend/vite.config.js`, then add the proxy. The file currently looks like:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

Change it to:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

- [ ] **Step 3: Verify frontend still builds**

```bash
cd frontend && npm install && npm run build
```

Expected: build succeeds, no errors.

---

## Task 2 — Create `backend/` scaffold

**Files:**
- Create: `backend/package.json`
- Create: `backend/server.js`
- Create: `backend/src/routes/health.js`
- Create: `backend/src/db/supabase.js`
- Create: `backend/src/middleware/errorHandler.js`
- Create: `backend/src/controllers/` (empty directory placeholder — add `.gitkeep`)
- Create: `backend/src/services/` (empty directory placeholder — add `.gitkeep`)

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "foodbot-backend",
  "version": "0.0.1",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

- [ ] **Step 2: Create `backend/server.js`**

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const healthRouter = require('./src/routes/health');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', healthRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FoodBot backend running on port ${PORT}`);
});
```

- [ ] **Step 3: Create `backend/src/routes/health.js`**

```js
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
```

- [ ] **Step 4: Create `backend/src/db/supabase.js`**

```js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
```

- [ ] **Step 5: Create `backend/src/middleware/errorHandler.js`**

```js
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

module.exports = errorHandler;
```

- [ ] **Step 6: Create placeholder .gitkeep files**

```bash
mkdir -p backend/src/controllers backend/src/services
touch backend/src/controllers/.gitkeep
touch backend/src/services/.gitkeep
```

- [ ] **Step 7: Install backend dependencies and verify server starts**

```bash
cd backend && npm install && npm run dev
```

Expected output: `FoodBot backend running on port 3001`

- [ ] **Step 8: Verify health endpoint**

```bash
curl http://localhost:3001/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

---

## Task 3 — Write full Supabase migration SQL (20 tables)

**Files:**
- Create: `backend/supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create `backend/supabase/migrations/001_initial_schema.sql`**

```sql
-- ============================================================
-- FYP-26-S2-6 AI Food Assistant Chatbot (FoodBot)
-- Initial Schema — 20 tables
-- Run in Supabase SQL Editor
-- ============================================================

-- Reference tables (no FKs outward)
CREATE TABLE dietary_tags (
  tag_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar NOT NULL UNIQUE
  -- Values: Halal, Vegan, Vegetarian, GlutenFree
);

CREATE TABLE allergens (
  allergen_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         varchar NOT NULL UNIQUE
  -- Values: Peanuts, Dairy, Gluten, Shellfish, Eggs, Soy
);

CREATE TABLE faq_entries (
  faq_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question    text NOT NULL,
  answer      text NOT NULL,
  category    varchar,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamp NOT NULL DEFAULT now()
);

-- Core entity tables
CREATE TABLE users (
  user_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          varchar NOT NULL UNIQUE,
  name           varchar NOT NULL,
  password_hash  varchar NOT NULL,
  role           varchar NOT NULL DEFAULT 'registered'
                   CHECK (role IN ('guest', 'registered', 'admin')),
  is_locked      boolean NOT NULL DEFAULT false,
  lock_until     timestamp,
  created_at     timestamp NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  session_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(user_id) ON DELETE SET NULL,
  created_at   timestamp NOT NULL DEFAULT now(),
  last_activity timestamp NOT NULL DEFAULT now(),
  expires_at   timestamp NOT NULL,
  is_active    boolean NOT NULL DEFAULT true
);

CREATE TABLE recipes (
  recipe_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar NOT NULL,
  description   text,
  instructions  text,
  cooking_time  int,
  servings      int,
  category      varchar,
  source        varchar NOT NULL DEFAULT 'db'
                  CHECK (source IN ('db', 'ai')),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamp NOT NULL DEFAULT now()
);

CREATE TABLE ingredients (
  ingredient_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           varchar NOT NULL UNIQUE,
  category       varchar CHECK (category IN ('Produce','Dairy','Pantry','Meat','Seafood','Other'))
);

-- Junction tables
CREATE TABLE recipe_ingredients (
  recipe_id     uuid NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
  quantity      decimal,
  unit          varchar,
  is_optional   boolean NOT NULL DEFAULT false,
  PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE TABLE recipe_dietary_tags (
  recipe_id  uuid NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES dietary_tags(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE TABLE recipe_allergens (
  recipe_id   uuid NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  allergen_id uuid NOT NULL REFERENCES allergens(allergen_id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, allergen_id)
);

-- Nutrition (1-to-1 with recipes)
CREATE TABLE nutrition_info (
  nutrition_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     uuid NOT NULL UNIQUE REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  calories      decimal,
  protein_g     decimal,
  carbs_g       decimal,
  fats_g        decimal,
  fibre_g       decimal
);

-- User preference tables
CREATE TABLE user_dietary_preferences (
  user_id  uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES dietary_tags(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE user_allergens (
  user_id     uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  allergen_id uuid NOT NULL REFERENCES allergens(allergen_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, allergen_id)
);

CREATE TABLE user_favourites (
  user_id    uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  recipe_id  uuid NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  saved_at   timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

-- Meal planning
CREATE TABLE meal_plans (
  plan_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  week_start_date  date NOT NULL,
  created_at       timestamp NOT NULL DEFAULT now()
);

CREATE TABLE meal_plan_items (
  item_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid NOT NULL REFERENCES meal_plans(plan_id) ON DELETE CASCADE,
  recipe_id   uuid NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  day_of_week varchar NOT NULL CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  meal_type   varchar NOT NULL CHECK (meal_type IN ('B','L','D'))
);

-- Shopping lists
CREATE TABLE shopping_lists (
  list_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE shopping_list_items (
  item_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id       uuid NOT NULL REFERENCES shopping_lists(list_id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
  quantity      decimal,
  unit          varchar,
  is_checked    boolean NOT NULL DEFAULT false
);

-- Support
CREATE TABLE support_requests (
  request_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(user_id) ON DELETE SET NULL,
  message     text NOT NULL,
  status      varchar NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at  timestamp NOT NULL DEFAULT now()
);

-- Error logging
CREATE TABLE error_logs (
  log_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(user_id) ON DELETE SET NULL,
  error_type  varchar NOT NULL,
  message     text NOT NULL,
  endpoint    varchar,
  created_at  timestamp NOT NULL DEFAULT now(),
  is_resolved boolean NOT NULL DEFAULT false
);
```

- [ ] **Step 2: Pause — ask user to run migration SQL in Supabase SQL Editor (Step B above)**

Wait for user confirmation that all 20 tables were created without errors before continuing.

---

## Task 4 — Write seed SQL

**Files:**
- Create: `backend/supabase/seeds/001_seed.sql`

- [ ] **Step 1: Create `backend/supabase/seeds/001_seed.sql`**

```sql
-- ============================================================
-- FoodBot Seed Data
-- Run AFTER 001_initial_schema.sql
-- Safe to re-run (ON CONFLICT DO NOTHING)
-- ============================================================

-- Dietary tags
INSERT INTO dietary_tags (name) VALUES
  ('Halal'), ('Vegan'), ('Vegetarian'), ('GlutenFree')
ON CONFLICT (name) DO NOTHING;

-- Allergens
INSERT INTO allergens (name) VALUES
  ('Peanuts'), ('Dairy'), ('Gluten'), ('Shellfish'), ('Eggs'), ('Soy')
ON CONFLICT (name) DO NOTHING;

-- Ingredients
INSERT INTO ingredients (name, category) VALUES
  ('chicken', 'Meat'),
  ('garlic', 'Produce'),
  ('lemon', 'Produce'),
  ('olive oil', 'Pantry'),
  ('salt', 'Pantry'),
  ('pepper', 'Pantry'),
  ('butter', 'Dairy'),
  ('thyme', 'Pantry'),
  ('rice', 'Pantry'),
  ('beef', 'Meat'),
  ('egg', 'Produce'),
  ('soy sauce', 'Pantry'),
  ('onion', 'Produce'),
  ('oil', 'Pantry'),
  ('pasta', 'Pantry'),
  ('tomato', 'Produce'),
  ('basil', 'Produce'),
  ('bread', 'Pantry'),
  ('mushroom', 'Produce'),
  ('cheese', 'Dairy'),
  ('carrot', 'Produce'),
  ('capsicum', 'Produce'),
  ('broccoli', 'Produce'),
  ('salmon', 'Seafood'),
  ('honey', 'Pantry'),
  ('ginger', 'Produce'),
  ('spring onion', 'Produce'),
  ('celery', 'Produce')
ON CONFLICT (name) DO NOTHING;

-- Recipes
INSERT INTO recipes (recipe_id, name, description, instructions, cooking_time, servings, category, source)
VALUES
  (gen_random_uuid(), 'Lemon Garlic Chicken', 'A simple and flavourful chicken dish.', '1. Season chicken with salt and pepper. 2. Heat olive oil in a pan over medium-high heat. 3. Sear chicken 5-6 mins each side until golden. 4. Add minced garlic and cook 1 min. 5. Squeeze lemon juice over chicken. 6. Rest 5 mins before serving.', 35, 2, 'Western', 'db'),
  (gen_random_uuid(), 'Garlic Butter Chicken Thighs', 'Rich and juicy oven-finished chicken thighs.', '1. Pat chicken dry, season generously. 2. Melt butter in oven-safe skillet. 3. Sear thighs skin-side down 8 mins. 4. Flip, add garlic and thyme. 5. Bake at 200°C for 20 mins. 6. Baste with pan juices before serving.', 40, 2, 'Western', 'db'),
  (gen_random_uuid(), 'Beef Fried Rice', 'Classic Asian fried rice with beef.', '1. Cook rice a day ahead and refrigerate. 2. Slice beef thinly, marinate in soy sauce. 3. Stir-fry beef in hot wok, set aside. 4. Scramble eggs, set aside. 5. Fry garlic and onion until fragrant. 6. Add rice, stir-fry on high heat. 7. Return beef and eggs, mix well.', 30, 2, 'Asian', 'db'),
  (gen_random_uuid(), 'Tomato Pasta', 'A simple Italian tomato pasta.', '1. Boil salted water, cook pasta al dente. 2. Sauté garlic in olive oil 1 min. 3. Add crushed tomatoes, simmer 10 mins. 4. Season with salt and fresh basil. 5. Toss pasta in sauce. 6. Serve with optional parmesan.', 25, 2, 'Italian', 'db'),
  (gen_random_uuid(), 'Scrambled Eggs on Toast', 'Quick and easy breakfast.', '1. Whisk eggs with salt and pepper. 2. Melt butter in non-stick pan on low heat. 3. Add eggs, stir gently and continuously. 4. Remove from heat while still slightly wet. 5. Toast bread. 6. Serve eggs on toast immediately.', 10, 1, 'Western', 'db'),
  (gen_random_uuid(), 'Chicken Fried Rice', 'Quick weeknight fried rice.', '1. Use day-old cold rice for best results. 2. Dice chicken, stir-fry until cooked. 3. Push aside, scramble egg in same wok. 4. Add garlic and rice, fry on high heat. 5. Season with soy sauce. 6. Garnish with chopped spring onion.', 25, 2, 'Asian', 'db'),
  (gen_random_uuid(), 'Vegetable Stir Fry', 'Healthy and quick vegetable stir fry.', '1. Cut all vegetables into bite-size pieces. 2. Heat wok on high until smoking. 3. Add oil and fry garlic 30 seconds. 4. Add harder veg first (carrot, broccoli). 5. Add remaining veg, toss constantly. 6. Season with soy sauce, serve immediately.', 20, 2, 'Asian', 'db'),
  (gen_random_uuid(), 'Honey Soy Salmon', 'Sweet and savoury glazed salmon.', '1. Mix soy sauce, honey, garlic, ginger as marinade. 2. Marinate salmon 15+ mins. 3. Heat oil in pan over medium-high. 4. Cook salmon 4 mins skin side down. 5. Flip, pour marinade over, cook 3 more mins. 6. Baste with glaze before serving.', 25, 2, 'Asian', 'db'),
  (gen_random_uuid(), 'Mushroom Omelette', 'Classic fluffy omelette with mushrooms.', '1. Slice mushrooms, sauté in butter until golden. 2. Whisk 3 eggs with salt and pepper. 3. Pour eggs into same pan on medium. 4. When edges set, add mushrooms and cheese. 5. Fold omelette in half. 6. Slide onto plate and serve.', 13, 1, 'Western', 'db'),
  (gen_random_uuid(), 'Minestrone Soup', 'Hearty Italian vegetable soup.', '1. Sauté onion, carrot, celery in olive oil 5 mins. 2. Add garlic, cook 1 min. 3. Add crushed tomatoes and 1L water. 4. Simmer 15 mins. 5. Add pasta, cook until tender. 6. Season, serve with crusty bread.', 45, 4, 'Italian', 'db');
```

- [ ] **Step 2: Pause — ask user to run seed SQL in Supabase SQL Editor (Step C above)**

Wait for user confirmation before continuing.

---

## Task 5 — Create `.env.example` files

**Files:**
- Create: `backend/.env.example`
- Create: `frontend/.env.example`

- [ ] **Step 1: Create `backend/.env.example`**

```
# Supabase — get from Project Settings → API
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# OpenAI — needed for Phase 3
OPENAI_API_KEY=sk-placeholder

# Server
SESSION_SECRET=replace-with-a-long-random-string
PORT=3001
```

- [ ] **Step 2: Create `frontend/.env.example`**

```
# Supabase public/anon key — safe to use in frontend
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API base URL
VITE_API_BASE_URL=http://localhost:3001
```

- [ ] **Step 3: Pause — ask user to create real `.env` files from examples (Step D above)**

---

## Task 6 — Update `.gitignore`

**Files:**
- Modify: `.gitignore` (at root)

- [ ] **Step 1: Replace root `.gitignore` content with the following**

```
# Environment — never commit real secrets
.env
.env.local
.env.*.local
frontend/.env
frontend/.env.local
backend/.env
backend/.env.local

# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Build output
dist/
frontend/dist/
backend/dist/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Claude — never commit
CLAUDE.md
.claude/
PROJECT_PROGRESS.md
```

---

## Task 7 — Update `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README.md with setup instructions**

```markdown
# FoodBot — AI Food Assistant Chatbot

Group FYP-26-S2-6 | CSCI321 | SIM–University of Wollongong Australia

## Prerequisites
- Node.js 18+
- npm
- A Supabase project (see Setup)

## Setup

### 1. Clone the repo
git clone https://github.com/Mehsua/csit321-fyp-26-s2-6-recipebot.git
cd csit321-fyp-26-s2-6-recipebot

### 2. Install dependencies
cd frontend && npm install
cd ../backend && npm install

### 3. Configure environment variables
cp backend/.env.example backend/.env      # fill in your Supabase and OpenAI keys
cp frontend/.env.example frontend/.env    # fill in your Supabase public key

### 4. Set up Supabase database
- Run `backend/supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor
- Run `backend/supabase/seeds/001_seed.sql` in Supabase SQL Editor

### 5. Run the app
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev

Frontend: http://localhost:5173
Backend:  http://localhost:3001
Health check: http://localhost:3001/api/health
```

---

## Task 8 — Update documentation files

**Files:**
- Modify: `CODEBASE.md`
- Modify: `PROJECT_PROGRESS.md`
- Modify: `TEST_CASES.md`

- [ ] **Step 1: Update `CODEBASE.md`**

Update each section of `CODEBASE.md` with what was actually built in Phase 1:

1. **Current Phase Completed** → change to `Phase 1 — Backend Scaffold + Supabase Schema`
2. **Project Structure** → update full tree to show `frontend/` and `backend/` folders with every file and one-line description
3. **How to Run** → update with two-terminal instructions (frontend + backend)
4. **Environment Variables** → fill in all vars from `backend/.env.example` and `frontend/.env.example` with which file uses each one
5. **Backend API Endpoints** → add `GET /api/health` row
6. **Services and Classes** → add `supabase.js` (Supabase client singleton) and `errorHandler.js` (middleware)
7. **Database Schema** → update seeded status for dietary_tags, allergens, ingredients, recipes after confirming seed ran
8. **Key Files** → add every new file in `backend/` with one-line description
9. **Implementation Decisions** → record any decisions made during implementation not specified in the plan
10. **Known Issues** → remove any issues fixed in this phase, add any new ones found
11. **Phase Update Log** → add Phase 1 entry with date and summary

- [ ] **Step 2: Update `PROJECT_PROGRESS.md`** — mark Phase 1 as complete, record files changed, test results, pending user actions resolved

- [ ] **Step 3: Update `TEST_CASES.md`** — fill in Actual Result and Pass/Fail columns for P1-01 through P1-11

---

## 3-Agent Review (after all tasks complete)

### Agent 2 — Requirement Verification (Haiku)
Prompt: "Verify that Phase 1 has been fully implemented. Check: (1) `frontend/` folder contains all React files and Vite builds successfully, (2) `backend/` has correct folder structure with server.js, routes/health.js, db/supabase.js, middleware/errorHandler.js, (3) migration SQL has all 20 ERD tables, (4) seed SQL covers dietary_tags (4 rows), allergens (6 rows), ingredients (28 rows), recipes (10 rows), (5) both .env.example files exist with correct variable names, (6) .gitignore covers all .env files, CLAUDE.md, and PROJECT_PROGRESS.md. Report pass/fail per item."

### Agent 3 — Code Quality & Security (Opus)
Prompt: "Review Phase 1 backend code for quality and security. Check: (1) no hardcoded credentials in any file, (2) Supabase client uses environment variables not literals, (3) Express has cors, helmet, morgan configured, (4) error handler is present and wired up, (5) health endpoint returns correct JSON, (6) SQL uses safe patterns with no injection risk, (7) .env files are not present in the committed code. Report findings with recommended fixes."

---

## Acceptance Criteria

| ID | Criterion | How to Verify |
|---|---|---|
| P1-01 | Frontend Vite dev server starts | `cd frontend && npm run dev` → starts on port 5173, no errors |
| P1-02 | Backend Express server starts | `cd backend && npm run dev` → `FoodBot backend running on port 3001` |
| P1-03 | Health endpoint returns correct response | `curl http://localhost:3001/api/health` → `{"status":"ok","timestamp":"..."}` |
| P1-04 | All 20 Supabase tables exist | Supabase table editor shows all 20 tables |
| P1-05 | FK constraints are valid | Seed SQL runs without constraint errors |
| P1-06 | Recipes seeded | `SELECT COUNT(*) FROM recipes` → 10 |
| P1-07 | dietary_tags seeded | `SELECT * FROM dietary_tags` → Halal, Vegan, Vegetarian, GlutenFree |
| P1-08 | allergens seeded | `SELECT * FROM allergens` → Peanuts, Dairy, Gluten, Shellfish, Eggs, Soy |
| P1-09 | No hardcoded credentials | Code review of all new files — no API keys, passwords, or Supabase keys in source |
| P1-10 | `.env` not committed | `git status` → `.env` does not appear |
| P1-11 | `CLAUDE.md` not committed | `git status` → `CLAUDE.md` does not appear |

---

## Rollback Plan

If anything breaks during Phase 1:

| What broke | How to roll back |
|---|---|
| Frontend move broke the build | `git mv frontend/src src` etc. to reverse all `git mv` commands. No files were deleted. |
| Backend files cause issues | Delete the `backend/` folder entirely. It is all new — no existing code is affected. |
| Supabase schema has errors | Go to Supabase → SQL Editor, run `DROP TABLE IF EXISTS <table> CASCADE;` for each table, then re-run the corrected migration. |
| Seed SQL errors | Run `DELETE FROM recipes; DELETE FROM ingredients; DELETE FROM dietary_tags; DELETE FROM allergens;` and re-run corrected seed. |
| `.gitignore` change causes issues | Restore previous `.gitignore` from git: `git checkout HEAD -- .gitignore` |

**Never use `git reset --hard` without user approval.**

---

## Stop Conditions

Stop and ask the user if any of the following occur:
- Supabase URL/keys are needed to proceed
- A table relationship in the ERD is unclear
- Any task requires changing `frontend/src/App.jsx`
- A task requires touching files outside the approved scope
- The migration SQL produces constraint errors
- The build fails after moving frontend files
- A new major issue is discovered not covered by this plan
