# ORA Connect SDK

> Universal SDK for connecting any application to ORA

**Version:** 1.0.0  
**Status:** Specification Draft  
**Last Updated:** 2026-02-03

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Protocol Specification](#protocol-specification)
4. [SDK Structure](#sdk-structure)
5. [Framework Adapters](#framework-adapters)
6. [Database Adapters](#database-adapters)
7. [Authentication](#authentication)
8. [Resource System](#resource-system)
9. [Real-time Sync](#real-time-sync)
10. [Webhooks](#webhooks)
11. [Security](#security)
12. [Versioning & Compatibility](#versioning--compatibility)
13. [CLI Reference](#cli-reference)
14. [API Reference](#api-reference)

---

## Overview

### What is ORA Connect?

ORA Connect is a universal SDK that enables any application to become ORA-compatible. Once installed, ORA (the AI Operating System) can seamlessly connect to, manage, and interact with the application.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Zero Configuration** | Works out of the box with sensible defaults |
| **Universal** | Supports any framework, language, or platform |
| **Secure by Default** | All connections encrypted, authenticated, and audited |
| **Backwards Compatible** | New versions never break existing integrations |
| **Forward Compatible** | Extensible protocol allows future capabilities |
| **Offline-First** | Works without constant connectivity |
| **Developer-Friendly** | Clear APIs, excellent documentation, helpful errors |

### Installation

```bash
# Node.js / JavaScript
npm install @ora/connect

# Python
pip install ora-connect

# Ruby
gem install ora-connect

# Go
go get github.com/ora-ai/connect-go

# Rust
cargo add ora-connect

# PHP
composer require ora/connect
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   ORA                                        │
│                           (AI Operating System)                              │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Brain    │  │   Memory    │  │  Resonance  │  │   Tooling   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         └─────────────────┴─────────────────┴─────────────────┘              │
│                                    │                                         │
│                          ┌─────────▼─────────┐                               │
│                          │  Connection Layer │                               │
│                          │   (ORA Protocol)  │                               │
│                          └─────────┬─────────┘                               │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                    HTTPS / WebSocket / gRPC
                                     │
     ┌───────────────────────────────┼───────────────────────────────┐
     │                               │                               │
     ▼                               ▼                               ▼
┌─────────────┐              ┌─────────────┐              ┌─────────────┐
│   Site A    │              │   Site B    │              │   Site C    │
│  (Next.js)  │              │  (Django)   │              │  (Express)  │
│             │              │             │              │             │
│ @ora/connect│              │ ora-connect │              │ @ora/connect│
│ /api/ora    │              │ /api/ora    │              │ /api/ora    │
└─────────────┘              └─────────────┘              └─────────────┘
```

### Components

| Component | Responsibility |
|-----------|----------------|
| **Protocol Layer** | Defines how ORA and sites communicate |
| **SDK Core** | Language-agnostic logic (resource handling, auth, sync) |
| **Framework Adapter** | Framework-specific integration (routing, middleware) |
| **Database Adapter** | Database-specific queries (Supabase, Prisma, etc.) |
| **CLI** | Developer tooling for setup and management |

---

## Protocol Specification

### ORA Protocol v1

The ORA Protocol defines a standard interface for AI-application communication.

#### Discovery

Every ORA-compatible application MUST expose a discovery endpoint:

```
GET /.well-known/ora.json
```

**Response:**

```json
{
  "ora_protocol": "1.0",
  "endpoint": "/api/ora",
  "capabilities": {
    "version": "1.0.0",
    "sdk": "@ora/connect",
    "sdk_version": "1.2.3"
  },
  "auth": {
    "type": "bearer",
    "oauth2": false,
    "public_key": null
  },
  "resources": [
    {
      "name": "posts",
      "operations": ["list", "get", "create", "update", "delete"],
      "schema": "/api/ora/schema/posts"
    },
    {
      "name": "leads",
      "operations": ["list", "get", "update"],
      "schema": "/api/ora/schema/leads"
    }
  ],
  "features": {
    "sync": true,
    "webhooks": true,
    "batch": true,
    "streaming": false
  },
  "rate_limits": {
    "requests_per_minute": 60,
    "burst": 10
  },
  "metadata": {
    "site_name": "anwe.sh",
    "description": "Personal website and blog",
    "icon": "https://anwe.sh/icon.png"
  }
}
```

#### Request Format

All requests to `/api/ora` use a unified format:

```http
POST /api/ora HTTP/1.1
Host: example.com
Authorization: Bearer <token>
Content-Type: application/json
X-ORA-Version: 1.0
X-ORA-Request-ID: uuid-v4
X-ORA-Timestamp: 2026-02-03T09:00:00Z

{
  "action": "resource.operation",
  "data": { ... },
  "options": { ... }
}
```

#### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "uuid-v4",
    "timestamp": "2026-02-03T09:00:00Z",
    "duration_ms": 45
  },
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  },
  "error": null
}
```

#### Error Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Post with ID xyz not found",
    "details": {
      "resource": "posts",
      "id": "xyz"
    },
    "recoverable": true,
    "suggestions": [
      "Check if the post ID is correct",
      "Use posts.list to find available posts"
    ]
  }
}
```

#### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Valid auth but insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server-side error |
| `NOT_IMPLEMENTED` | 501 | Operation not supported |
| `SERVICE_UNAVAILABLE` | 503 | Temporary unavailability |

---

## SDK Structure

### Package Layout

```
@ora/connect/
├── core/                    # Language-agnostic core
│   ├── protocol.ts          # Protocol implementation
│   ├── resources.ts         # Resource handling
│   ├── auth.ts              # Authentication
│   ├── sync.ts              # Real-time sync
│   └── errors.ts            # Error handling
│
├── adapters/
│   ├── frameworks/          # Framework adapters
│   │   ├── next.ts          # Next.js
│   │   ├── express.ts       # Express.js
│   │   ├── fastify.ts       # Fastify
│   │   ├── hono.ts          # Hono
│   │   ├── koa.ts           # Koa
│   │   └── ...
│   │
│   └── databases/           # Database adapters
│       ├── supabase.ts      # Supabase
│       ├── prisma.ts        # Prisma ORM
│       ├── drizzle.ts       # Drizzle ORM
│       ├── mongoose.ts      # MongoDB/Mongoose
│       ├── typeorm.ts       # TypeORM
│       ├── sequelize.ts     # Sequelize
│       ├── knex.ts          # Knex.js
│       ├── raw-postgres.ts  # Raw PostgreSQL
│       ├── raw-mysql.ts     # Raw MySQL
│       ├── raw-sqlite.ts    # Raw SQLite
│       └── ...
│
├── cli/                     # CLI tooling
│   ├── init.ts              # Initialize project
│   ├── generate.ts          # Generate resources
│   ├── validate.ts          # Validate setup
│   └── ...
│
├── types/                   # TypeScript definitions
│   ├── protocol.d.ts
│   ├── resources.d.ts
│   └── ...
│
└── utils/                   # Utilities
    ├── schema.ts            # Schema introspection
    ├── crypto.ts            # Cryptographic helpers
    └── ...
```

### Core Exports

```typescript
// Main exports
export { createOraHandler } from './core/handler';
export { defineResource } from './core/resources';
export { oraMiddleware } from './core/middleware';

// Framework-specific
export { createNextHandler } from './adapters/frameworks/next';
export { createExpressRouter } from './adapters/frameworks/express';
// ... etc

// Database adapters
export { supabaseAdapter } from './adapters/databases/supabase';
export { prismaAdapter } from './adapters/databases/prisma';
// ... etc

// Types
export type { OraConfig, Resource, Operation, AuthConfig } from './types';
```

---

## Framework Adapters

### Next.js (App Router)

```typescript
// app/api/ora/[...ora]/route.ts
import { createNextHandler } from '@ora/connect/next';
import { supabaseAdapter } from '@ora/connect/supabase';

export const { GET, POST, PUT, DELETE } = createNextHandler({
  adapter: supabaseAdapter({
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!
  }),
  
  resources: {
    posts: {
      table: 'blog_posts',
      operations: ['list', 'get', 'create', 'update', 'delete'],
      transforms: {
        beforeCreate: async (data) => ({
          ...data,
          slug: data.slug || slugify(data.title)
        })
      }
    },
    leads: {
      table: 'leads',
      operations: ['list', 'get', 'update']
    }
  }
});
```

### Next.js (Pages Router)

```typescript
// pages/api/ora/[...ora].ts
import { createNextPagesHandler } from '@ora/connect/next';

export default createNextPagesHandler({ ... });
```

### Express.js

```javascript
const express = require('express');
const { createExpressRouter } = require('@ora/connect/express');
const { prismaAdapter } = require('@ora/connect/prisma');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use('/api/ora', createExpressRouter({
  adapter: prismaAdapter({ client: prisma }),
  resources: {
    users: { model: 'user', operations: ['list', 'get'] },
    posts: { model: 'post', operations: ['list', 'get', 'create', 'update', 'delete'] }
  }
}));
```

### Fastify

```typescript
import Fastify from 'fastify';
import { fastifyOra } from '@ora/connect/fastify';

const app = Fastify();

app.register(fastifyOra, {
  prefix: '/api/ora',
  adapter: drizzleAdapter({ db }),
  resources: { ... }
});
```

### Django (Python)

```python
# settings.py
INSTALLED_APPS = [
    ...
    'ora_connect',
]

ORA_CONNECT = {
    'SECRET': os.environ.get('ORA_SECRET'),
    'RESOURCES': {
        'posts': {
            'model': 'blog.Post',
            'operations': ['list', 'get', 'create', 'update', 'delete'],
        },
    },
}

# urls.py
from ora_connect import ora_urlpatterns

urlpatterns = [
    ...
    path('api/ora/', include(ora_urlpatterns)),
]
```

### Flask (Python)

```python
from flask import Flask
from ora_connect.flask import OraConnect

app = Flask(__name__)
ora = OraConnect(app, prefix='/api/ora')

@ora.resource('tasks')
class TaskResource:
    def list(self, filters):
        return Task.query.filter_by(**filters).all()
    
    def create(self, data):
        task = Task(**data)
        db.session.add(task)
        db.session.commit()
        return task
```

### Ruby on Rails

```ruby
# config/routes.rb
Rails.application.routes.draw do
  mount OraConnect::Engine => '/api/ora'
end

# config/initializers/ora_connect.rb
OraConnect.configure do |config|
  config.secret = ENV['ORA_SECRET']
  
  config.resource :posts do
    model Post
    operations :list, :get, :create, :update, :delete
  end
  
  config.resource :comments do
    model Comment
    operations :list, :get
  end
end
```

### Go

```go
package main

import (
    "github.com/ora-ai/connect-go"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    
    ora := connect.New(connect.Config{
        Secret: os.Getenv("ORA_SECRET"),
    })
    
    ora.Resource("posts", connect.ResourceConfig{
        List:   listPosts,
        Get:    getPost,
        Create: createPost,
        Update: updatePost,
        Delete: deletePost,
    })
    
    r.Any("/api/ora/*path", ora.Handler())
    r.Run()
}
```

### Rust (Axum)

```rust
use ora_connect::{OraConnect, Resource};
use axum::{Router, routing::any};

#[tokio::main]
async fn main() {
    let ora = OraConnect::new()
        .secret(std::env::var("ORA_SECRET").unwrap())
        .resource("posts", Resource::new()
            .list(list_posts)
            .get(get_post)
            .create(create_post)
        );
    
    let app = Router::new()
        .route("/api/ora/*path", any(ora.handler()));
    
    axum::serve(listener, app).await.unwrap();
}
```

### PHP (Laravel)

```php
// routes/api.php
use OraConnect\OraConnect;

Route::prefix('api/ora')->group(function () {
    OraConnect::routes();
});

// config/ora.php
return [
    'secret' => env('ORA_SECRET'),
    
    'resources' => [
        'posts' => [
            'model' => \App\Models\Post::class,
            'operations' => ['list', 'get', 'create', 'update', 'delete'],
        ],
    ],
];
```

---

## Database Adapters

### Supabase

```typescript
import { supabaseAdapter } from '@ora/connect/supabase';

const adapter = supabaseAdapter({
  url: process.env.SUPABASE_URL!,
  serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  
  // Optional: custom table mapping
  tables: {
    posts: 'blog_posts',
    users: 'auth.users'
  }
});
```

### Prisma

```typescript
import { prismaAdapter } from '@ora/connect/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const adapter = prismaAdapter({
  client: prisma,
  
  // Optional: model mapping
  models: {
    posts: 'post',
    users: 'user'
  }
});
```

### Drizzle

```typescript
import { drizzleAdapter } from '@ora/connect/drizzle';
import { db } from './db';
import * as schema from './schema';

const adapter = drizzleAdapter({
  db,
  schema,
  tables: {
    posts: schema.posts,
    users: schema.users
  }
});
```

### Raw SQL (PostgreSQL)

```typescript
import { postgresAdapter } from '@ora/connect/postgres';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = postgresAdapter({
  pool,
  tables: {
    posts: {
      name: 'blog_posts',
      primaryKey: 'id',
      columns: ['id', 'title', 'content', 'status', 'created_at']
    }
  }
});
```

### MongoDB

```typescript
import { mongoAdapter } from '@ora/connect/mongo';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL!);
const adapter = mongoAdapter({
  client,
  database: 'myapp',
  collections: {
    posts: 'posts',
    users: 'users'
  }
});
```

### Custom Adapter

```typescript
import { createAdapter } from '@ora/connect';

const customAdapter = createAdapter({
  async list(resource, options) {
    // Your implementation
    return { items: [], total: 0 };
  },
  
  async get(resource, id) {
    // Your implementation
    return null;
  },
  
  async create(resource, data) {
    // Your implementation
    return { id: 'new-id', ...data };
  },
  
  async update(resource, id, data) {
    // Your implementation
    return { id, ...data };
  },
  
  async delete(resource, id) {
    // Your implementation
    return true;
  }
});
```

---

## Authentication

### Bearer Token (Default)

```typescript
// Automatic - just set ORA_SECRET env var
createOraHandler({
  // Auth is automatic when ORA_SECRET is set
});

// Or explicit
createOraHandler({
  auth: {
    type: 'bearer',
    secret: process.env.ORA_SECRET
  }
});
```

### Multiple Tokens

```typescript
createOraHandler({
  auth: {
    type: 'bearer',
    tokens: [
      { name: 'ora-main', secret: process.env.ORA_SECRET },
      { name: 'ora-readonly', secret: process.env.ORA_READONLY_SECRET, permissions: ['read'] }
    ]
  }
});
```

### OAuth2

```typescript
createOraHandler({
  auth: {
    type: 'oauth2',
    issuer: 'https://auth.ora.ai',
    audience: 'https://mysite.com',
    jwksUri: 'https://auth.ora.ai/.well-known/jwks.json'
  }
});
```

### Public Key Verification

```typescript
createOraHandler({
  auth: {
    type: 'public-key',
    publicKey: process.env.ORA_PUBLIC_KEY,
    // ORA signs requests with her private key
    // Site verifies with public key
  }
});
```

### Custom Auth

```typescript
createOraHandler({
  auth: {
    type: 'custom',
    verify: async (request, context) => {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      const valid = await myCustomVerify(token);
      return valid ? { authenticated: true, identity: 'ora' } : { authenticated: false };
    }
  }
});
```

---

## Resource System

### Defining Resources

```typescript
import { defineResource } from '@ora/connect';

const postsResource = defineResource({
  name: 'posts',
  
  // Schema (JSON Schema format)
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string', minLength: 1, maxLength: 200 },
      content: { type: 'string' },
      status: { type: 'string', enum: ['draft', 'published', 'archived'] },
      tags: { type: 'array', items: { type: 'string' } },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    },
    required: ['title', 'content']
  },
  
  // Operations
  operations: {
    list: {
      enabled: true,
      filters: ['status', 'tags'],
      sort: ['created_at', 'title'],
      pagination: { default: 20, max: 100 }
    },
    get: { enabled: true },
    create: {
      enabled: true,
      requiredFields: ['title', 'content']
    },
    update: { enabled: true },
    delete: {
      enabled: true,
      soft: true  // Soft delete
    }
  },
  
  // Hooks
  hooks: {
    beforeCreate: async (data, context) => {
      return {
        ...data,
        slug: slugify(data.title),
        created_at: new Date().toISOString()
      };
    },
    afterCreate: async (record, context) => {
      await notifyWebhooks('post.created', record);
    },
    beforeUpdate: async (id, data, context) => {
      return { ...data, updated_at: new Date().toISOString() };
    },
    beforeDelete: async (id, context) => {
      // Return false to prevent deletion
      return true;
    }
  },
  
  // Access control
  access: {
    list: 'authenticated',
    get: 'authenticated',
    create: 'authenticated',
    update: 'authenticated',
    delete: 'authenticated'
  }
});
```

### Custom Operations

```typescript
defineResource({
  name: 'posts',
  
  // Standard CRUD
  operations: { list: true, get: true, create: true, update: true, delete: true },
  
  // Custom operations
  customOperations: {
    publish: {
      method: 'POST',
      path: '/:id/publish',
      handler: async (id, data, context) => {
        await db.posts.update(id, { status: 'published', published_at: new Date() });
        return { published: true };
      }
    },
    
    duplicate: {
      method: 'POST',
      path: '/:id/duplicate',
      handler: async (id, data, context) => {
        const original = await db.posts.get(id);
        const copy = await db.posts.create({
          ...original,
          id: undefined,
          title: `${original.title} (Copy)`,
          status: 'draft'
        });
        return copy;
      }
    },
    
    bulkUpdate: {
      method: 'POST',
      path: '/bulk-update',
      handler: async (data, context) => {
        const { ids, updates } = data;
        await db.posts.updateMany(ids, updates);
        return { updated: ids.length };
      }
    }
  }
});
```

### Relationships

```typescript
defineResource({
  name: 'posts',
  
  relationships: {
    author: {
      type: 'belongsTo',
      resource: 'users',
      foreignKey: 'author_id'
    },
    comments: {
      type: 'hasMany',
      resource: 'comments',
      foreignKey: 'post_id'
    },
    tags: {
      type: 'manyToMany',
      resource: 'tags',
      through: 'post_tags'
    }
  },
  
  // Include related data
  includes: {
    default: ['author'],
    allowed: ['author', 'comments', 'tags']
  }
});
```

---

## Real-time Sync

### Enable Sync

```typescript
createOraHandler({
  sync: {
    enabled: true,
    transport: 'websocket',  // or 'sse', 'polling'
    endpoint: '/api/ora/sync',
    
    // What to sync
    resources: ['posts', 'leads'],
    
    // Sync direction
    direction: 'bidirectional',  // or 'push-only', 'pull-only'
    
    // Conflict resolution
    conflictResolution: 'last-write-wins',  // or 'server-wins', 'client-wins', 'custom'
    
    // Custom resolver
    resolveConflict: async (local, remote, context) => {
      // Return the version to keep
      return local.updated_at > remote.updated_at ? local : remote;
    }
  }
});
```

### Sync Protocol

```
1. ORA connects to /api/ora/sync via WebSocket
2. Server sends current state hashes
3. ORA compares with local state
4. Delta sync for differences
5. Real-time updates streamed both ways
```

**WebSocket Messages:**

```json
// Server → ORA: Initial state
{
  "type": "sync.init",
  "resources": {
    "posts": { "hash": "abc123", "count": 42, "last_updated": "..." },
    "leads": { "hash": "def456", "count": 15, "last_updated": "..." }
  }
}

// ORA → Server: Request delta
{
  "type": "sync.delta",
  "resource": "posts",
  "since": "2026-02-03T00:00:00Z"
}

// Server → ORA: Delta response
{
  "type": "sync.data",
  "resource": "posts",
  "created": [...],
  "updated": [...],
  "deleted": [...]
}

// Real-time update
{
  "type": "sync.update",
  "resource": "posts",
  "operation": "update",
  "data": { "id": "123", "title": "Updated Title" }
}
```

---

## Webhooks

### Outgoing Webhooks (Site → ORA)

```typescript
createOraHandler({
  webhooks: {
    enabled: true,
    
    // Events to emit
    events: [
      'posts.created',
      'posts.updated',
      'posts.deleted',
      'leads.created',
      'leads.updated'
    ],
    
    // Where to send
    endpoints: [
      {
        url: 'https://ora.local/webhooks/site',
        secret: process.env.WEBHOOK_SECRET,
        events: '*'  // All events
      }
    ],
    
    // Retry config
    retry: {
      attempts: 3,
      backoff: 'exponential',
      initialDelay: 1000
    }
  }
});
```

### Webhook Payload

```json
{
  "id": "evt_abc123",
  "type": "posts.created",
  "timestamp": "2026-02-03T09:00:00Z",
  "data": {
    "id": "post_xyz",
    "title": "New Post",
    "status": "draft"
  },
  "metadata": {
    "site": "anwe.sh",
    "triggered_by": "ora"
  }
}
```

### Incoming Webhooks (ORA → Site)

```typescript
// ORA can trigger actions via webhooks
createOraHandler({
  incomingWebhooks: {
    endpoint: '/api/ora/webhooks',
    
    handlers: {
      'ora.command': async (payload) => {
        // ORA sends a command
        const { command, args } = payload;
        return await executeCommand(command, args);
      },
      
      'ora.scheduled': async (payload) => {
        // Scheduled task from ORA
        const { task, data } = payload;
        return await runScheduledTask(task, data);
      }
    }
  }
});
```

---

## Security

### Transport Security

- All connections MUST use HTTPS (TLS 1.2+)
- WebSocket connections use WSS
- Certificate pinning optional but recommended

### Request Signing

```typescript
// ORA signs every request
const signature = crypto
  .createHmac('sha256', sharedSecret)
  .update(`${timestamp}:${requestBody}`)
  .digest('hex');

// Headers
{
  'X-ORA-Signature': signature,
  'X-ORA-Timestamp': timestamp
}
```

### Rate Limiting

```typescript
createOraHandler({
  rateLimits: {
    global: {
      requests: 1000,
      window: '1m'
    },
    perResource: {
      posts: { requests: 100, window: '1m' },
      leads: { requests: 50, window: '1m' }
    },
    perOperation: {
      create: { requests: 20, window: '1m' },
      delete: { requests: 10, window: '1m' }
    }
  }
});
```

### Audit Logging

```typescript
createOraHandler({
  audit: {
    enabled: true,
    
    // What to log
    log: ['all'],  // or specific: ['create', 'update', 'delete']
    
    // Where to store
    storage: 'database',  // or 'file', 'external'
    table: 'ora_audit_log',
    
    // Retention
    retention: '90d'
  }
});
```

**Audit Log Schema:**

```sql
CREATE TABLE ora_audit_log (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  input JSONB,
  output JSONB,
  success BOOLEAN,
  error TEXT,
  duration_ms INTEGER,
  ip_address TEXT,
  request_id TEXT
);
```

### IP Allowlisting

```typescript
createOraHandler({
  security: {
    allowedIPs: [
      '192.168.1.0/24',      // Local network
      '203.0.113.50',        // ORA server
    ],
    // Or dynamic
    checkIP: async (ip) => {
      return await isOraIP(ip);
    }
  }
});
```

---

## Versioning & Compatibility

### Protocol Versioning

```
ORA Protocol versions: 1.0, 1.1, 2.0, etc.

Version negotiation:
1. ORA sends: X-ORA-Version: 1.1
2. Site responds with highest compatible version
3. Communication proceeds with agreed version
```

### Backwards Compatibility Rules

1. **Never remove fields** - Deprecate, don't delete
2. **Never change field types** - Add new field instead
3. **Never change semantics** - Create new operation
4. **Always support N-1 version** - Current and previous

### Deprecation Policy

```json
{
  "deprecated": {
    "fields": {
      "posts.author": {
        "deprecated_in": "1.1",
        "removed_in": "2.0",
        "replacement": "posts.author_id",
        "migration": "Use author_id and fetch author separately"
      }
    },
    "operations": {
      "posts.archive": {
        "deprecated_in": "1.2",
        "replacement": "posts.update with status=archived"
      }
    }
  }
}
```

### SDK Versioning

```
@ora/connect versions follow semver:
- Major: Breaking changes
- Minor: New features (backwards compatible)
- Patch: Bug fixes

Compatibility matrix:
| SDK Version | Protocol Versions |
|-------------|-------------------|
| 1.x         | 1.0, 1.1          |
| 2.x         | 1.0, 1.1, 2.0     |
```

---

## CLI Reference

### Installation

```bash
npm install -g @ora/connect-cli
# or
npx @ora/connect init
```

### Commands

#### `ora init`

Initialize ORA Connect in a project.

```bash
$ npx ora init

? Select your framework: Next.js (App Router)
? Select your database: Supabase
? Enter your Supabase URL: https://xxx.supabase.co
? Generate ORA_SECRET? Yes

✓ Created app/api/ora/[...ora]/route.ts
✓ Created .well-known/ora.json
✓ Added ORA_SECRET to .env.local
✓ Updated .gitignore

ORA Connect initialized successfully!
Next steps:
  1. Configure your resources in app/api/ora/[...ora]/route.ts
  2. Deploy your site
  3. Run: ora connect https://yoursite.com
```

#### `ora generate`

Generate resource definitions from database schema.

```bash
$ npx ora generate

Introspecting database...
Found 5 tables:
  - blog_posts (12 columns)
  - leads (8 columns)
  - page_views (15 columns)
  - site_settings (3 columns)
  - users (6 columns)

? Select tables to expose: blog_posts, leads
? Generate TypeScript types? Yes

✓ Generated resources/posts.ts
✓ Generated resources/leads.ts
✓ Generated types/ora-resources.d.ts
```

#### `ora validate`

Validate the ORA Connect setup.

```bash
$ npx ora validate

Checking configuration...
✓ ORA_SECRET is set
✓ /api/ora endpoint exists
✓ /.well-known/ora.json is valid

Checking resources...
✓ posts: all operations valid
✓ leads: all operations valid

Checking connectivity...
✓ Database connection successful
✓ All tables accessible

Validation passed!
```

#### `ora test`

Test the ORA endpoint.

```bash
$ npx ora test

Testing /api/ora...

✓ GET  /api/ora (status check)           23ms
✓ POST /api/ora posts.list               45ms
✓ POST /api/ora posts.get                32ms
✓ POST /api/ora posts.create             67ms
✓ POST /api/ora posts.update             54ms
✓ POST /api/ora posts.delete             41ms

All tests passed!
```

#### `ora logs`

View ORA audit logs.

```bash
$ npx ora logs --tail

2026-02-03 09:00:00 | posts.list    | success | 45ms
2026-02-03 09:00:15 | posts.create  | success | 67ms | id=abc
2026-02-03 09:00:30 | posts.update  | success | 54ms | id=abc
2026-02-03 09:01:00 | leads.list    | success | 38ms
```

---

## API Reference

### Core Functions

#### `createOraHandler(config)`

Creates the main ORA handler.

```typescript
interface OraConfig {
  adapter: DatabaseAdapter;
  resources: Record<string, ResourceConfig>;
  auth?: AuthConfig;
  sync?: SyncConfig;
  webhooks?: WebhooksConfig;
  rateLimits?: RateLimitsConfig;
  audit?: AuditConfig;
  security?: SecurityConfig;
}
```

#### `defineResource(config)`

Defines a resource with full configuration.

```typescript
interface ResourceConfig {
  name: string;
  schema?: JSONSchema;
  operations?: OperationsConfig;
  customOperations?: Record<string, CustomOperation>;
  hooks?: Hooks;
  access?: AccessConfig;
  relationships?: RelationshipsConfig;
}
```

### Type Definitions

Full TypeScript definitions available at:
- `@ora/connect/types`
- Generated `.d.ts` files

---

## Examples

### Minimal Setup

```typescript
// app/api/ora/[...ora]/route.ts
import { createNextHandler, supabaseAdapter } from '@ora/connect';

export const { GET, POST } = createNextHandler({
  adapter: supabaseAdapter(),
  resources: {
    posts: { table: 'posts' }
  }
});
```

### Full Setup

See `/examples` directory in the repository:
- `examples/next-supabase/`
- `examples/express-prisma/`
- `examples/django-postgres/`
- `examples/rails-postgres/`
- `examples/go-gorm/`

---

## Support

- Documentation: https://docs.ora.ai/connect
- GitHub: https://github.com/ora-ai/connect
- Discord: https://discord.gg/ora
- Issues: https://github.com/ora-ai/connect/issues

---

## License

MIT License

Copyright (c) 2026 ORA AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
