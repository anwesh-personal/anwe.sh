# API Documentation

Complete API reference for Vanilla SaaS Template.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "tenantSlug": "default" // optional
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user",
    "tier": "free"
  },
  "token": "jwt-token"
}
```

#### POST /auth/login
Login user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "tenantSlug": "default" // optional
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "jwt-token"
}
```

#### GET /auth/profile
Get current user profile. Requires authentication.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user",
    "tier": "free",
    "tenantName": "Default Tenant",
    "tenantSlug": "default"
  }
}
```

#### PUT /auth/profile
Update user profile. Requires authentication.

**Request:**
```json
{
  "fullName": "Jane Doe",
  "username": "jane",
  "preferences": {}
}
```

### Token Wallet

#### GET /tokens/wallet
Get user token wallet. Requires authentication.

**Response:**
```json
{
  "wallet": {
    "id": "uuid",
    "userId": "uuid",
    "currentTokens": 1000,
    "reservedTokens": 0,
    "lifetimeTokens": 1000,
    "monthlyAllocationTokens": 0,
    "status": "active"
  },
  "policy": {
    "baseAllocation": 1000,
    "monthlyAllocation": null,
    "allocationMode": "lifetime",
    "enforcementMode": "monitor"
  }
}
```

#### GET /tokens/ledger
Get token ledger entries. Requires authentication.

**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "direction": "debit",
      "amount": 100,
      "balanceAfter": 900,
      "reason": "AI execution",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /tokens/adjust
Manually adjust tokens. Requires admin role.

**Request:**
```json
{
  "userId": "uuid", // optional, defaults to current user
  "amount": 100,
  "direction": "credit", // credit, debit, reserve, release, adjustment
  "reason": "Manual adjustment",
  "source": "manual",
  "metadata": {}
}
```

### AI

#### GET /ai/providers
Get available AI providers. Requires authentication.

**Response:**
```json
{
  "providers": [
    {
      "id": "uuid",
      "name": "OpenAI",
      "provider_type": "openai",
      "is_active": true,
      "models": ["gpt-4", "gpt-3.5-turbo"]
    }
  ]
}
```

#### GET /ai/models
Get available AI models. Requires authentication.

**Query Parameters:**
- `providerId` (optional) - Filter by provider

**Response:**
```json
{
  "models": [
    {
      "id": "uuid",
      "name": "GPT-4",
      "model_id": "gpt-4",
      "provider_type": "openai",
      "context_window": 8192,
      "max_tokens": 4096,
      "input_cost_per_1k": 0.03,
      "output_cost_per_1k": 0.06
    }
  ]
}
```

#### POST /ai/execute
Execute AI model. Requires authentication.

**Request:**
```json
{
  "modelId": "uuid",
  "prompt": "Hello, world!",
  "systemPrompt": "You are a helpful assistant.", // optional
  "temperature": 0.7, // optional
  "maxTokens": 1000, // optional
  "stream": false // optional
}
```

**Response:**
```json
{
  "executionId": "uuid",
  "content": "Hello! How can I help you?",
  "usage": {
    "promptTokens": 10,
    "completionTokens": 15,
    "totalTokens": 25
  },
  "cost": 0.001
}
```

#### GET /ai/executions
Get execution history. Requires authentication.

**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "executions": [
    {
      "id": "uuid",
      "model_name": "GPT-4",
      "status": "completed",
      "total_tokens": 25,
      "cost_usd": 0.001,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /ai/executions/:id
Get specific execution. Requires authentication.

**Response:**
```json
{
  "execution": {
    "id": "uuid",
    "model_name": "GPT-4",
    "status": "completed",
    "input_data": { "prompt": "..." },
    "output_data": { "content": "..." },
    "total_tokens": 25,
    "cost_usd": 0.001
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are rate-limited:
- Default: 100 requests per 15 minutes per IP
- Configure in backend `.env`: `RATE_LIMIT_MAX_REQUESTS`

## Pagination

List endpoints support pagination:
- `limit` - Number of items per page (default: 50)
- `offset` - Number of items to skip (default: 0)
