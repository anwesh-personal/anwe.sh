# ⚡ Quick Start - 5 Minutes

## Copy-Paste Setup

```bash
# 1. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Copy environment files
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env

# 3. Start database (Docker)
docker-compose up -d postgres redis

# 4. Run migrations
cd backend && npm run migrate && cd ..

# 5. Start backend (Terminal 1)
cd backend && npm run dev

# 6. Start frontend (Terminal 2)
cd frontend && npm run dev
```

**Open:** http://localhost:5173

---

## What to Edit First

### `backend/.env`:
- `JWT_SECRET` - Change to a random string
- `DATABASE_URL` - Verify PostgreSQL connection

### `frontend/.env`:
- `VITE_API_URL` - Should be `http://localhost:3001/api`

---

## That's It! 🎉

You're ready to use the SaaS Builder!
