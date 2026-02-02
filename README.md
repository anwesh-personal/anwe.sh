# 🚀 Vanilla Multi-Tenant AI SaaS Template

A complete, production-ready multi-tenant SaaS application template with AI integration, token wallet system, super admin functionality, and everything you need to build a robust SaaS platform.

## ✨ Features

- **Multi-Tenant Architecture** - Complete tenant isolation with RLS policies
- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Token Wallet System** - Flexible token/credit management with policies and ledger
- **AI Provider Integration** - OpenAI, Anthropic, Google AI with failover support
- **Super Admin Dashboard** - Complete admin panel for platform management
- **5 Brand Kits with Themes** - Modern Minimal, Tech Bold, Elegant Classic, Creative Playful, Corporate Professional
- **Dark/Light Mode** - Full dark mode support for all brand kits
- **Custom Typography** - Distinct fonts for each brand kit (Inter, Space Grotesk, Playfair Display, Poppins, Roboto)
- **RESTful API** - Express.js backend with comprehensive endpoints
- **React Frontend** - Modern React app with context-based state management
- **Database Migrations** - PostgreSQL schema with Supabase/PostgREST
- **Queue System** - Background job processing with Bull/Redis
- **API Key Management** - Secure API key generation and validation

## 📁 Project Structure

```
vanilla-saas-template/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, tenant isolation, etc.
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── routes/         # API routes
│   ├── package.json
│   └── .env.example
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utilities
│   ├── package.json
│   └── vite.config.js
├── database/                # Database migrations
│   ├── migrations/         # SQL migration files
│   └── seeds/              # Seed data
├── docs/                    # Documentation
│   ├── SETUP.md            # Setup guide
│   ├── API.md              # API documentation
│   ├── ARCHITECTURE.md     # Architecture overview
│   └── DEPLOYMENT.md       # Deployment guide
└── docker-compose.yml      # Docker setup
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 14+ (or Supabase)
- Redis (for queue system)
- Git

### Installation

1. **Clone and setup:**
```bash
cd vanilla-saas-template
```

2. **Backend setup:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database and API keys
npm run dev
```

3. **Frontend setup:**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

4. **Database setup:**
```bash
# Run migrations (see database/README.md)
psql -U postgres -d your_database < database/migrations/001_initial_schema.sql
```

## 📚 Documentation

- [Setup Guide](./docs/SETUP.md) - Detailed setup instructions
- [API Documentation](./docs/API.md) - Complete API reference
- [Architecture](./docs/ARCHITECTURE.md) - System architecture
- [Theme Guide](./docs/THEME_GUIDE.md) - Complete theme and brand kit guide
- [Theme Mockups](./docs/THEME_MOCKUPS.md) - Visual mockups of all themes
- [Audit Report](./AUDIT_REPORT.md) - Complete feature audit
- [Audit Summary](./AUDIT_SUMMARY.md) - What's included summary
- [Improvements](./IMPROVEMENTS.md) - Recommended improvements
- [Database Migrations](./database/migrations/README.md) - Migration guide
- [Deployment](./docs/DEPLOYMENT.md) - Production deployment

## 🏗️ Core Components

### Multi-Tenancy
- Tenant isolation at database level (RLS)
- Tenant context middleware
- Tenant-specific configurations

### Token Wallet
- Token allocation policies
- Usage tracking and ledger
- Monthly/lifetime allocation modes
- Token reservation system

### AI Providers
- OpenAI integration
- Anthropic Claude integration
- Google Gemini integration
- Provider failover and load balancing
- Token usage tracking

### Super Admin
- User management
- Tenant management
- System configuration
- Analytics and monitoring

### Design System
- 5 distinct brand kits with unique identities
- Dark/Light mode for each theme
- Custom typography per brand kit
- Theme switcher component
- Visual mockups and showcase page

### Engine System
- AI engine deployment and management
- Engine assignments (user/level/tier)
- User-specific engine copies
- Engine API keys
- Engine execution tracking

### Workflow System
- Custom workflow definitions
- Workflow execution engine
- Workflow templates
- Quality gates and validation
- Execution history

### Level System
- Granular feature control
- Level pricing management
- Level restrictions
- Level benefits
- Upgrade paths
- Feature usage tracking
- Level analytics

### Routing System
- Multiple routing strategies (round-robin, least-loaded, health-based, etc.)
- Worker registry and health monitoring
- Routing metrics
- Worker event logging
- Load balancing

### Orchestration System
- Multi-agent communication
- Resource allocation
- Performance metrics
- System monitoring

## 🔐 Security

- JWT-based authentication
- Row Level Security (RLS) policies
- API key encryption
- Rate limiting
- CORS configuration
- Input validation and sanitization

## 📝 License

MIT License - feel free to use this template for your projects!

## 🤝 Contributing

This is a template project. Feel free to fork and customize for your needs.

---

**Built with ❤️ for the SaaS community**
