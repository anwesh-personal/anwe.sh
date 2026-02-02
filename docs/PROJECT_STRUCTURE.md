# Project Structure

Complete file structure and purpose of each component.

```
vanilla-saas-template/
│
├── README.md                    # Main project README
├── QUICK_START.md              # Quick start guide
├── PROJECT_STRUCTURE.md        # This file
├── .gitignore                  # Git ignore rules
├── docker-compose.yml          # Docker setup for local development
│
├── backend/                    # Express.js API server
│   ├── package.json           # Backend dependencies
│   ├── .env.example          # Environment variables template
│   └── src/
│       ├── server.js         # Main server file
│       ├── config/           # Configuration files
│       │   ├── database.js  # PostgreSQL connection
│       │   └── redis.js     # Redis connection
│       ├── middleware/       # Express middleware
│       │   ├── auth.js      # JWT authentication
│       │   └── tenant.js    # Tenant context
│       ├── controllers/      # Route controllers
│       │   ├── authController.js
│       │   ├── tokenController.js
│       │   └── aiController.js
│       ├── routes/           # API routes
│       │   ├── auth.js
│       │   ├── tokens.js
│       │   └── ai.js
│       └── services/         # Business logic
│           ├── tokenService.js
│           └── aiService.js
│
├── frontend/                   # React application
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS config
│   ├── postcss.config.js     # PostCSS config
│   ├── index.html            # HTML entry point
│   └── src/
│       ├── main.jsx          # React entry point
│       ├── App.jsx           # Main app component
│       ├── App.css           # App styles
│       ├── index.css         # Global styles
│       ├── lib/              # Utilities
│       │   └── api.js        # Axios API client
│       ├── contexts/         # React contexts
│       │   ├── AuthContext.jsx
│       │   └── TokenWalletContext.jsx
│       ├── components/       # Reusable components
│       │   └── PrivateRoute.jsx
│       ├── pages/            # Page components
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Profile.jsx
│       │   ├── AIStudio.jsx
│       │   └── SuperAdmin.jsx
│       └── services/         # API services
│           └── aiService.js
│
├── database/                  # Database files
│   ├── README.md            # Database documentation
│   └── migrations/          # SQL migration files
│       ├── 001_initial_schema.sql
│       ├── 002_token_management_functions.sql
│       ├── 003_rls_policies.sql
│       └── 004_seed_data.sql
│
└── docs/                     # Documentation
    ├── SETUP.md             # Detailed setup guide
    ├── API.md               # API documentation
    └── ARCHITECTURE.md      # Architecture overview
```

## File Purposes

### Backend Files

**server.js**
- Main Express server
- Middleware setup
- Route registration
- Error handling

**config/database.js**
- PostgreSQL connection pool
- Tenant context helpers
- Connection management

**config/redis.js**
- Redis client setup
- Queue system connection

**middleware/auth.js**
- JWT token validation
- User authentication
- Role-based access control
- Super admin authentication

**middleware/tenant.js**
- Tenant identification
- Tenant context setup
- Subdomain/header parsing

**controllers/**
- Handle HTTP requests
- Validate input
- Call services
- Return responses

**routes/**
- Define API endpoints
- Apply middleware
- Route to controllers

**services/**
- Business logic
- Database operations
- External API calls
- Token management
- AI provider integration

### Frontend Files

**main.jsx**
- React app initialization
- Root component rendering

**App.jsx**
- Main app component
- Router setup
- Context providers
- Route definitions

**lib/api.js**
- Axios instance
- Request/response interceptors
- Token management
- Error handling

**contexts/**
- Global state management
- Authentication state
- Token wallet state
- User data

**components/**
- Reusable UI components
- Private route wrapper
- Common elements

**pages/**
- Page-level components
- Route components
- User interfaces

**services/**
- API service functions
- Data fetching
- Business logic calls

### Database Files

**001_initial_schema.sql**
- Core database tables
- Indexes
- Triggers
- Basic structure

**002_token_management_functions.sql**
- Token wallet functions
- Token adjustment logic
- Auto-allocation functions
- Monthly reset function

**003_rls_policies.sql**
- Row Level Security policies
- Tenant isolation
- User access control
- Admin permissions

**004_seed_data.sql**
- Default tenant
- Default levels
- Token policies
- Super admin user
- AI providers
- AI models

### Documentation

**README.md**
- Project overview
- Features
- Quick links

**QUICK_START.md**
- Fast setup guide
- 5-minute setup
- Common issues

**SETUP.md**
- Detailed setup instructions
- All configuration options
- Troubleshooting

**API.md**
- Complete API reference
- All endpoints
- Request/response examples

**ARCHITECTURE.md**
- System architecture
- Design decisions
- Data flow
- Security model

## Key Concepts

### Multi-Tenancy
- Tenant isolation at database level
- Context-based filtering
- RLS policies enforce separation

### Token System
- Wallet-based token management
- Policy-driven allocation
- Immutable ledger
- Multiple allocation modes

### AI Integration
- Multiple provider support
- Unified interface
- Cost tracking
- Usage monitoring

### Authentication
- JWT-based auth
- Role-based access
- Super admin system
- Session management

## Extension Points

### Adding New Features

1. **New API Endpoint**
   - Add route in `backend/src/routes/`
   - Add controller in `backend/src/controllers/`
   - Add service if needed

2. **New Database Table**
   - Create migration file
   - Add RLS policies
   - Update seed data if needed

3. **New Frontend Page**
   - Add component in `frontend/src/pages/`
   - Add route in `App.jsx`
   - Create service if needed

4. **New AI Provider**
   - Add provider config in database
   - Add integration in `aiService.js`
   - Add models metadata

## Best Practices

- Always use migrations for database changes
- Keep services focused on single responsibility
- Use TypeScript for type safety (optional)
- Write tests for critical paths
- Document API changes
- Follow RESTful conventions
- Use environment variables for config
- Implement proper error handling
- Log important events
- Use transactions for multi-step operations
