# 🚀 First Steps - Getting Started

## When You Open This in a New Workspace

Follow these steps in order:

---

## Step 1: Install Dependencies

### Backend:
```bash
cd backend
npm install
```

### Frontend:
```bash
cd frontend
npm install
```

---

## Step 2: Set Up Environment Variables

### Backend:
```bash
cd backend
cp env.example .env
```

Then edit `backend/.env` and update:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Generate a random secret key
- `REDIS_HOST` and `REDIS_PORT` - If using Redis
- AI Provider API keys (if using AI features)

### Frontend:
```bash
cd frontend
cp env.example .env
```

Then edit `frontend/.env` and update:
- `VITE_API_URL` - Backend API URL (default: `http://localhost:3001/api`)

---

## Step 3: Set Up Database

### Option A: Using Docker (Easiest)
```bash
# From root directory
docker-compose up -d postgres redis
```

This starts PostgreSQL and Redis containers.

### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb vanilla_saas`
3. Update `DATABASE_URL` in `backend/.env`

---

## Step 4: Run Database Migrations

```bash
cd backend
npm run migrate
```

This creates all tables, indexes, RLS policies, and seed data.

---

## Step 5: Start the Services

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

You should see: `🚀 Server running on port 3001`

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

You should see: `Local: http://localhost:5173`

---

## Step 6: Open in Browser

Open: **http://localhost:5173**

You should see the **Landing Page** with the SaaS Builder!

---

## Quick Verification Checklist

- [ ] Dependencies installed (backend & frontend)
- [ ] Environment files created (`.env` in both folders)
- [ ] Database running (PostgreSQL)
- [ ] Migrations completed (`npm run migrate`)
- [ ] Backend server running (port 3001)
- [ ] Frontend server running (port 5173)
- [ ] Landing page loads in browser

---

## Troubleshooting

### Port Already in Use
If port 3001 or 5173 is taken:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.js`

### Database Connection Error
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `backend/.env`
- Make sure database exists

### Migration Errors
- Ensure PostgreSQL is running
- Check database connection
- Verify all migration files exist in `database/migrations/`

### Frontend Can't Connect to Backend
- Check `VITE_API_URL` in `frontend/.env`
- Ensure backend is running on correct port
- Check CORS settings in `backend/src/server.js`

---

## What You'll See

1. **Landing Page** (`/`) - Stunning hero section with SaaS Builder CTA
2. **SaaS Builder** (`/builder`) - 7-step configuration wizard
3. **Brand Kits** (`/brand-kits`) - Preview all 5 themes
4. **Dashboard** (`/dashboard`) - After login

---

## Next Steps After Setup

1. **Test the Builder:**
   - Go to `/builder`
   - Fill out all 7 steps
   - Generate template
   - Download ZIP

2. **Create First User:**
   - Go to `/register`
   - Create account
   - Login at `/login`

3. **Explore Features:**
   - Dashboard
   - AI Studio
   - Workflow Builder
   - Analytics
   - Worker Monitoring

---

## Docker Alternative (Full Stack)

If you want to run everything with Docker:

```bash
# From root directory
docker-compose up
```

This starts:
- PostgreSQL
- Redis
- Backend API
- Frontend (with Nginx)

Access at: `http://localhost:5173`

---

## That's It! 🎉

You're ready to use the Vanilla SaaS Template!

**Everything is in the `vanilla-saas-template/` folder and ready to go.**
