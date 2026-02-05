# API Schema

What the ORA API looks like on the anwe.sh side.

---

## Overview

The ORA API is a single endpoint that:
1. **GET** - Returns the schema (what actions are available)
2. **POST** - Executes an action

---

## Endpoint

```
https://anwe.sh/api/ora
```

---

## Authentication

All requests require the ORA_SECRET header:

```
Authorization: Bearer {ORA_SECRET}
```

---

## GET /api/ora - Fetch Schema

Returns what actions are available on this site.

**Request:**
```http
GET /api/ora HTTP/1.1
Host: anwe.sh
Authorization: Bearer ora_secret_abc123
```

**Response:**
```json
{
    "name": "anwe.sh ORA API",
    "version": "1.0.0",
    "actions": {
        "posts.list": {
            "description": "List all blog posts",
            "method": "POST",
            "params": {
                "status": {
                    "type": "string",
                    "required": false,
                    "enum": ["draft", "published", "archived"]
                },
                "limit": {
                    "type": "number",
                    "required": false,
                    "default": 10
                }
            }
        },
        "posts.get": {
            "description": "Get a single post by ID",
            "method": "POST",
            "params": {
                "id": { "type": "string", "required": true }
            }
        },
        "posts.create": {
            "description": "Create a new blog post",
            "method": "POST",
            "params": {
                "title": { "type": "string", "required": true },
                "content": { "type": "string", "required": true },
                "status": { "type": "string", "enum": ["draft", "published"] }
            }
        },
        "posts.publish": {
            "description": "Publish a draft post",
            "method": "POST",
            "params": {
                "id": { "type": "string", "required": true }
            }
        },
        "leads.list": {
            "description": "List leads from contact form",
            "method": "POST",
            "params": {
                "status": { "type": "string", "enum": ["new", "contacted", "closed"] }
            }
        },
        "leads.get": {
            "description": "Get lead details",
            "method": "POST",
            "params": {
                "id": { "type": "string", "required": true }
            }
        },
        "settings.get": {
            "description": "Get site settings",
            "method": "POST",
            "params": {}
        },
        "settings.update": {
            "description": "Update site settings",
            "method": "POST",
            "params": {
                "key": { "type": "string", "required": true },
                "value": { "type": "string", "required": true }
            }
        }
    }
}
```

---

## POST /api/ora - Execute Action

Executes an action on the site.

**Request:**
```http
POST /api/ora HTTP/1.1
Host: anwe.sh
Content-Type: application/json
Authorization: Bearer ora_secret_abc123

{
    "action": "posts.publish",
    "data": {
        "id": "post-uuid-123"
    }
}
```

**Response (Success):**
```json
{
    "success": true,
    "data": {
        "id": "post-uuid-123",
        "title": "TypeScript Best Practices",
        "status": "published",
        "publishedAt": "2026-02-05T08:30:00.000Z"
    }
}
```

**Response (Error):**
```json
{
    "success": false,
    "error": {
        "code": "NOT_FOUND",
        "message": "Post not found"
    }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing secret |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_ACTION` | 400 | Unknown action name |
| `INVALID_PARAMS` | 400 | Missing or invalid params |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Implementation on anwe.sh

File: `src/app/api/ora/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const ORA_SECRET = process.env.ORA_SECRET;

// Define available actions
const ACTIONS = {
    'posts.list': async (data: any) => {
        // Implementation
    },
    'posts.publish': async (data: any) => {
        // Implementation
    },
    // ... more actions
};

// Build schema from actions
const SCHEMA = {
    name: 'anwe.sh ORA API',
    version: '1.0.0',
    actions: {
        'posts.list': {
            description: 'List all blog posts',
            method: 'POST',
            params: {
                status: { type: 'string', required: false },
                limit: { type: 'number', required: false }
            }
        },
        // ... define params for each action
    }
};

// GET - Return schema
export async function GET(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${ORA_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(SCHEMA);
}

// POST - Execute action
export async function POST(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${ORA_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { action, data } = await req.json();
    
    if (!ACTIONS[action]) {
        return NextResponse.json(
            { success: false, error: { code: 'INVALID_ACTION', message: 'Unknown action' } },
            { status: 400 }
        );
    }
    
    try {
        const result = await ACTIONS[action](data);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
```
