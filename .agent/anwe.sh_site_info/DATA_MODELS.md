# Data Models

All TypeScript interfaces for the site connection system.

---

## Site Configuration

```typescript
// File: ~/.ora/sites/{slug}/config.json

interface SiteConfig {
    id: string;                    // UUID
    slug: string;                  // "anwe-sh" (folder name)
    name: string;                  // "My Portfolio"
    url: string;                   // "https://anwe.sh"
    apiEndpoint: string;           // "/api/ora"
    secret: string;                // Encrypted ORA_SECRET
    
    status: 'connected' | 'offline' | 'error';
    lastConnectedAt: string | null;
    lastSyncAt: string | null;
    lastError: string | null;
    
    enabledAgents: string[];       // ['ora', 'writer']
    autoSync: boolean;
    syncIntervalMinutes: number;
    
    createdAt: string;
    updatedAt: string;
}
```

---

## API Schema

```typescript
// File: ~/.ora/sites/{slug}/schema.json

interface ApiSchema {
    name: string;                  // "anwe.sh ORA API"
    version: string;
    actions: Record<string, ActionDefinition>;
    fetchedAt: string;
}

interface ActionDefinition {
    description: string;
    method: 'GET' | 'POST';
    params: Record<string, ParamDefinition>;
    returns?: { type: string; description?: string };
}

interface ParamDefinition {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description?: string;
    enum?: string[];
    default?: any;
}
```

---

## Agent Definition

```typescript
interface AgentDefinition {
    id: string;
    slug: string;                  // "writer", "task-123"
    name: string;
    systemPrompt: string;
    tools: string[];
    canSpawnAgents: boolean;
    memoryTypes: string[];
    
    type: 'persistent' | 'spawned';
    parentAgentId?: string;
    taskId?: string;
    expiresAt?: string;
    createdAt: string;
}
```

---

## Memory

```typescript
interface Memory {
    id: string;
    content: string;
    type: 'fact' | 'preference' | 'context' | 'task' | 'conversation';
    importance: number;            // 1-10
    
    accessCount: number;
    lastAccessedAt: string | null;
    healthScore: number;           // 0.0-1.0
    
    relatedTo: string[] | null;
    supersededBy: string | null;
    
    createdAt: string;
    updatedAt: string;
    expiresAt: string | null;
    
    syncedAt: string | null;
    syncStatus: 'pending' | 'synced' | 'local_only';
}
```

---

## Task Context

```typescript
interface TaskContext {
    id: string;
    taskDescription: string;
    inputData: object | null;
    outputData: object | null;
    status: 'active' | 'completed' | 'failed';
    createdAt: string;
    completedAt: string | null;
}
```

---

## Tool Definition

```typescript
interface Tool {
    name: string;                  // "anwe-sh.posts.publish"
    description: string;
    parameters: Record<string, ToolParam>;
    handler: (params: any, context: ToolContext) => Promise<any>;
}

interface ToolContext {
    siteSlug: string;
    agentSlug: string;
    conversationId?: string;
}
```

---

## Options Interfaces

```typescript
interface SpawnOptions {
    siteSlug: string;
    taskDescription: string;
    agentType: 'writer' | 'researcher' | 'analyst' | 'custom';
    parentAgentId?: string;
    tools?: string[];
    expiresInMinutes?: number;
}

interface CompleteOptions {
    extractMemories?: boolean;     // default: true
    extractTo?: string;            // default: 'ora'
    deleteImmediately?: boolean;   // default: false
}

type DisconnectAction = 'delete' | 'keep' | 'export';
```
