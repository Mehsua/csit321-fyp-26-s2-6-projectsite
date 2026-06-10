# FoodBot — AI Food Assistant Chatbot

Group FYP-26-S2-6 | CSCI321 | SIM–University of Wollongong Australia

## Prerequisites
- Node.js 18+
- npm
- A Supabase project

## Setup

### 1. Clone the repo
```
git clone https://github.com/Mehsua/csit321-fyp-26-s2-6-recipebot.git
cd csit321-fyp-26-s2-6-recipebot
```

### 2. Install dependencies
```
cd frontend && npm install
cd ../backend && npm install
```

### 3. Configure environment variables
```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Fill in your Supabase URL, keys, and OpenAI key.

### 4. Set up Supabase database
```
cd backend
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:push
```

### 5. Run the app

Terminal 1 — backend:
```
cd backend && npm run dev
```

Terminal 2 — frontend:
```
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/api/health
