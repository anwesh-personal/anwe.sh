# Setup Guide

Complete setup instructions for the Vanilla SaaS Template.

## Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 14+ (or Supabase account)
- Redis (for queue system)
- Git

## Step 1: Database Setup

### Option A: Local PostgreSQL

1. Create database:
```bash
createdb vanilla_saas
```

2. Run migrations:
```bash
psql -U postgres -d vanilla_saas < database/migrations/001_initial_schema.sql
psql -U postgres -d vanilla_saas < database/migrations/002_token_management_functions.sql
psql -U postgres -d vanilla_saas < database/migrations/003_rls_policies.sql
psql -U postgres -d vanilla_saas < database/migrations/004_seed_data.sql
```

### Option B: Supabase

1. Create a new Supabase project
2. Run migrations in Supabase SQL Editor in order:
   - 001_initial_schema.sql
   - 002_token_management_functions.sql
   - 003_rls_policies.sql
   - 004_seed_data.sql

## Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/vanilla_saas
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
GOOGLE_AI_API_KEY=your-key
```

5. Start backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

## Step 3: Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

4. Edit `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

5. Start frontend dev server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Step 4: Redis Setup (Optional)

For queue system and caching:

```bash
# Install Redis
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

## Step 5: Verify Installation

1. Open `http://localhost:5173`
2. Register a new account
3. Login and check dashboard
4. Test AI execution in AI Studio

## Default Credentials

After running seed data:
- Super Admin: `admin` / `admin123` (CHANGE IN PRODUCTION!)

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check connection string in `.env`
- Ensure database exists

### CORS Errors
- Verify `CORS_ORIGIN` in backend `.env` matches frontend URL
- Check backend is running on correct port

### AI Provider Errors
- Verify API keys are set in backend `.env`
- Check API key validity
- Ensure sufficient credits/quota

## Next Steps

- [ ] Change default super admin password
- [ ] Configure production environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Configure email service for notifications
- [ ] Set up monitoring and logging
- [ ] Review and customize RLS policies
- [ ] Configure backup strategy
