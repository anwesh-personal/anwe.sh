# Architecture Overview

Complete architecture documentation for Vanilla SaaS Template.

## System Architecture

```
┌─────────────┐
│   Frontend  │  React + Vite
│  (React)    │
└──────┬──────┘
       │ HTTP/REST
       │
┌──────▼──────┐
│   Backend   │  Express.js API
│  (Node.js)  │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│PostgreSQL│ │ Redis │
│Database │ │ Queue │
└─────────┘ └───────┘
```

## Multi-Tenancy

### Tenant Isolation

- **Database Level**: Row Level Security (RLS) policies ensure tenant data isolation
- **Application Level**: Tenant context middleware sets tenant_id for all queries
- **API Level**: Tenant identification via subdomain or header (`X-Tenant-Slug`)

### Tenant Context Flow

1. Request arrives with tenant identifier
2. Tenant middleware resolves tenant_id
3. Database context set via `SET app.tenant_id`
4. RLS policies automatically filter queries
5. Response returned with tenant-specific data

## Database Schema

### Core Tables

#### tenants
- Stores tenant/organization information
- Each tenant has unique slug and domain

#### users
- Multi-tenant user table
- Foreign key to tenants
- Role-based access (user, admin, superadmin)

#### levels
- Subscription/feature levels per tenant
- Defines tier and features

### Token System

#### user_token_wallets
- Current token balance
- Reserved tokens
- Lifetime and monthly allocations

#### level_token_policies
- Token allocation policies per level
- Monthly/lifetime modes
- Enforcement modes (monitor, warn, hard)

#### user_token_policies
- User-specific policy overrides
- Takes precedence over level policies

#### user_token_ledger
- Immutable transaction log
- All token operations recorded
- Audit trail for compliance

### AI System

#### ai_providers
- AI provider configurations
- Can be tenant-specific or global
- API keys encrypted

#### ai_models
- Model metadata and pricing
- Linked to providers
- Cost tracking

#### ai_executions
- Execution history
- Token usage tracking
- Cost calculation

## Authentication & Authorization

### JWT Tokens

- **Structure**: `{ userId, tenantId, iat, exp }`
- **Storage**: LocalStorage (frontend)
- **Validation**: Middleware on protected routes
- **Expiration**: Configurable (default: 7 days)

### Role Hierarchy

1. **superadmin** - Platform-wide access
2. **admin** - Tenant admin access
3. **user** - Standard user access

### Permission System

- Role-based access control (RBAC)
- Feature flags per tier
- API key permissions

## Token Wallet System

### Allocation Modes

#### Lifetime Mode
- Tokens allocated once
- Debits reduce balance
- No monthly reset

#### Monthly Mode
- Tokens allocated monthly
- Automatic reset
- Rollover support

### Operations

1. **Credit** - Add tokens
2. **Debit** - Spend tokens (AI execution)
3. **Reserve** - Hold tokens for pending operation
4. **Release** - Free reserved tokens
5. **Adjustment** - Manual correction

### Policy Enforcement

- **Monitor** - Track usage, no blocking
- **Warn** - Allow but log warnings
- **Hard** - Block when limit reached

## AI Provider Integration

### Supported Providers

1. **OpenAI** - GPT-4, GPT-3.5
2. **Anthropic** - Claude 3 Opus, Sonnet
3. **Google AI** - Gemini Pro

### Execution Flow

1. User submits request with model and prompt
2. System checks token balance
3. Creates execution record
4. Routes to appropriate provider
5. Executes AI request
6. Calculates token usage and cost
7. Debits tokens from wallet
8. Updates execution record
9. Returns result to user

### Failover Strategy

- Provider priority ordering
- Automatic failover on error
- Retry logic with exponential backoff

## API Design

### RESTful Principles

- Resource-based URLs
- HTTP methods (GET, POST, PUT, DELETE)
- Status codes
- JSON request/response

### Middleware Stack

1. **Helmet** - Security headers
2. **CORS** - Cross-origin requests
3. **Body Parser** - JSON parsing
4. **Rate Limiter** - Request throttling
5. **Tenant Middleware** - Tenant context
6. **Auth Middleware** - JWT validation
7. **Route Handler** - Business logic

## Frontend Architecture

### Component Structure

```
src/
├── components/     # Reusable components
├── contexts/       # React contexts (Auth, TokenWallet)
├── pages/          # Page components
├── services/       # API service layer
├── lib/            # Utilities (API client)
└── hooks/          # Custom React hooks
```

### State Management

- **React Context** - Global state (Auth, TokenWallet)
- **Local State** - Component-specific state
- **API Calls** - Axios with interceptors

### Routing

- **React Router** - Client-side routing
- **Private Routes** - Protected by authentication
- **Public Routes** - Login, Register

## Security

### Data Protection

- **Password Hashing** - bcrypt with salt rounds
- **API Key Encryption** - Encrypted at rest
- **JWT Signing** - HMAC SHA-256
- **HTTPS** - Required in production

### Row Level Security

- Database-level access control
- Automatic tenant filtering
- User-specific data access
- Admin override capabilities

### Input Validation

- Express Validator
- SQL injection prevention (parameterized queries)
- XSS protection (Helmet)
- Rate limiting

## Scalability

### Horizontal Scaling

- Stateless API design
- Shared database
- Redis for session/queue
- Load balancer ready

### Performance

- Database indexes on foreign keys
- Connection pooling
- Query optimization
- Caching strategy (Redis)

## Deployment

### Environment Variables

**Backend:**
- Database connection
- JWT secret
- AI provider keys
- Redis connection

**Frontend:**
- API URL
- App configuration

### Docker Support

- Docker Compose for local development
- Production-ready Dockerfiles
- Environment-based configuration

## Monitoring & Logging

### Logging

- Winston logger
- Log levels (error, warn, info, debug)
- Structured logging
- Error tracking

### Metrics

- Token usage tracking
- AI execution metrics
- User activity logs
- Performance monitoring

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] GraphQL API option
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Webhook system
- [ ] Plugin architecture
- [ ] Multi-region support
