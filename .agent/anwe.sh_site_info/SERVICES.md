# Core Services

Full implementation code for ORA Desktop services.

---

## 1. SiteManager

Manages site connections, folders, and databases.

```typescript
// src/services/site-manager.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import Database from 'better-sqlite3';
import archiver from 'archiver';

export class SiteManager {
    private sitesPath: string;
    private encryptionKey: Buffer;
    
    constructor() {
        this.sitesPath = path.join(os.homedir(), '.ora', 'sites');
        // In production, derive this from user's password or secure storage
        this.encryptionKey = crypto.scryptSync(
            process.env.ORA_ENCRYPTION_KEY || 'default-key',
            'salt',
            32
        );
    }
    
    /**
     * Generate URL-safe slug from URL
     */
    private urlToSlug(url: string): string {
        return new URL(url).hostname
            .replace(/^www\./, '')
            .replace(/\./g, '-')
            .replace(/[^a-z0-9-]/gi, '')
            .toLowerCase();
    }
    
    /**
     * Encrypt secret for storage
     */
    private async encryptSecret(secret: string): Promise<string> {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return `encrypted:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }
    
    /**
     * Decrypt stored secret
     */
    async decryptSecret(encrypted: string): Promise<string> {
        const [prefix, ivHex, authTagHex, data] = encrypted.split(':');
        if (prefix !== 'encrypted') return encrypted;
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    
    /**
     * Fetch API schema from remote site
     */
    async fetchSchema(url: string, secret: string): Promise<ApiSchema> {
        const response = await fetch(`${url}/api/ora`, {
            headers: {
                'Authorization': `Bearer ${secret}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid ORA secret');
            }
            throw new Error(`Failed to connect: ${response.status}`);
        }
        
        const schema = await response.json();
        schema.fetchedAt = new Date().toISOString();
        return schema;
    }
    
    /**
     * Create SQLite database for an agent
     */
    async createAgentDatabase(siteSlug: string, agentSlug: string): Promise<string> {
        const dbPath = path.join(this.sitesPath, siteSlug, `${agentSlug}.site.db`);
        
        const db = new Database(dbPath);
        
        db.exec(`
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;
            
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                type TEXT DEFAULT 'fact',
                importance INTEGER DEFAULT 5,
                access_count INTEGER DEFAULT 0,
                last_accessed_at TEXT,
                health_score REAL DEFAULT 1.0,
                related_to TEXT,
                superseded_by TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                expires_at TEXT,
                synced_at TEXT,
                sync_status TEXT DEFAULT 'pending'
            );
            
            CREATE TABLE IF NOT EXISTS task_context (
                id TEXT PRIMARY KEY,
                task_description TEXT NOT NULL,
                input_data TEXT,
                output_data TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                completed_at TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_type ON memories(type);
            CREATE INDEX IF NOT EXISTS idx_health ON memories(health_score);
            CREATE INDEX IF NOT EXISTS idx_importance ON memories(importance);
            CREATE INDEX IF NOT EXISTS idx_sync ON memories(sync_status);
        `);
        
        db.close();
        console.log(`Created database: ${dbPath}`);
        return dbPath;
    }
    
    /**
     * Add a new site connection
     */
    async addSite(options: {
        name: string;
        url: string;
        secret: string;
        enabledAgents?: string[];
    }): Promise<SiteConfig> {
        const slug = this.urlToSlug(options.url);
        const sitePath = path.join(this.sitesPath, slug);
        
        // Check if already exists
        try {
            await fs.access(sitePath);
            throw new Error(`Site ${slug} already connected`);
        } catch (e) {
            if (e.code !== 'ENOENT') throw e;
        }
        
        // Create folder structure
        await fs.mkdir(sitePath, { recursive: true });
        await fs.mkdir(path.join(sitePath, 'backups'), { recursive: true });
        
        // Fetch and cache schema
        const schema = await this.fetchSchema(options.url, options.secret);
        await fs.writeFile(
            path.join(sitePath, 'schema.json'),
            JSON.stringify(schema, null, 2)
        );
        
        // Create config
        const config: SiteConfig = {
            id: crypto.randomUUID(),
            slug,
            name: options.name,
            url: options.url,
            apiEndpoint: '/api/ora',
            secret: await this.encryptSecret(options.secret),
            status: 'connected',
            lastConnectedAt: new Date().toISOString(),
            lastSyncAt: null,
            lastError: null,
            enabledAgents: options.enabledAgents || ['ora'],
            autoSync: true,
            syncIntervalMinutes: 15,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await fs.writeFile(
            path.join(sitePath, 'config.json'),
            JSON.stringify(config, null, 2)
        );
        
        // Create databases for enabled agents
        for (const agentSlug of config.enabledAgents) {
            await this.createAgentDatabase(slug, agentSlug);
        }
        
        return config;
    }
    
    /**
     * Get site config
     */
    async getSiteConfig(slug: string): Promise<SiteConfig> {
        const configPath = path.join(this.sitesPath, slug, 'config.json');
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content);
    }
    
    /**
     * Update site config
     */
    async updateSiteConfig(slug: string, updates: Partial<SiteConfig>): Promise<SiteConfig> {
        const config = await this.getSiteConfig(slug);
        const updated = { ...config, ...updates, updatedAt: new Date().toISOString() };
        const configPath = path.join(this.sitesPath, slug, 'config.json');
        await fs.writeFile(configPath, JSON.stringify(updated, null, 2));
        return updated;
    }
    
    /**
     * List all connected sites
     */
    async listSites(): Promise<SiteConfig[]> {
        const sites: SiteConfig[] = [];
        
        try {
            const folders = await fs.readdir(this.sitesPath);
            for (const folder of folders) {
                try {
                    const config = await this.getSiteConfig(folder);
                    sites.push(config);
                } catch {}
            }
        } catch {}
        
        return sites;
    }
    
    /**
     * Export site as zip
     */
    async exportSite(slug: string): Promise<string> {
        const sitePath = path.join(this.sitesPath, slug);
        const exportDir = path.join(os.homedir(), '.ora', 'exports');
        await fs.mkdir(exportDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const zipPath = path.join(exportDir, `${slug}-backup-${timestamp}.zip`);
        
        return new Promise((resolve, reject) => {
            const output = require('fs').createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            output.on('close', () => resolve(zipPath));
            archive.on('error', reject);
            
            archive.pipe(output);
            archive.directory(sitePath, false);
            archive.finalize();
        });
    }
    
    /**
     * Disconnect from a site
     */
    async disconnectSite(slug: string, action: 'delete' | 'keep' | 'export'): Promise<string | null> {
        const sitePath = path.join(this.sitesPath, slug);
        
        switch (action) {
            case 'delete':
                await fs.rm(sitePath, { recursive: true, force: true });
                return null;
                
            case 'keep':
                await this.updateSiteConfig(slug, { status: 'offline' });
                return null;
                
            case 'export':
                const zipPath = await this.exportSite(slug);
                await fs.rm(sitePath, { recursive: true, force: true });
                return zipPath;
        }
    }
    
    /**
     * Get database path for an agent
     */
    getAgentDbPath(siteSlug: string, agentSlug: string): string {
        return path.join(this.sitesPath, siteSlug, `${agentSlug}.site.db`);
    }
    
    /**
     * Open database for an agent
     */
    openAgentDb(siteSlug: string, agentSlug: string): Database.Database {
        const dbPath = this.getAgentDbPath(siteSlug, agentSlug);
        return new Database(dbPath);
    }
}

export const siteManager = new SiteManager();
```

---

## 2. AgentSpawner

Creates and manages temporary agents for delegated tasks.

```typescript
// src/services/agent-spawner.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { siteManager } from './site-manager';

export class AgentSpawner {
    
    private getSystemPromptForType(type: string): string {
        const prompts: Record<string, string> = {
            writer: 'You are a content writer. Create engaging, well-structured content.',
            researcher: 'You are a researcher. Gather and analyze information thoroughly.',
            analyst: 'You are a data analyst. Analyze data and provide insights.',
            custom: 'You are a helpful assistant.'
        };
        return prompts[type] || prompts.custom;
    }
    
    private getDefaultToolsForType(type: string): string[] {
        const tools: Record<string, string[]> = {
            writer: ['posts.create', 'posts.update', 'memory.store', 'memory.recall'],
            researcher: ['memory.store', 'memory.recall', 'web.search'],
            analyst: ['memory.store', 'memory.recall', 'data.query'],
            custom: ['memory.store', 'memory.recall']
        };
        return tools[type] || tools.custom;
    }
    
    /**
     * Spawn a new agent for a task
     */
    async spawnAgent(options: {
        siteSlug: string;
        taskDescription: string;
        agentType: 'writer' | 'researcher' | 'analyst' | 'custom';
        parentAgentId?: string;
        tools?: string[];
        expiresInMinutes?: number;
    }): Promise<AgentDefinition> {
        const agentSlug = `task-${Date.now()}`;
        const taskId = crypto.randomUUID();
        
        const agent: AgentDefinition = {
            id: crypto.randomUUID(),
            slug: agentSlug,
            name: `Task Agent (${options.agentType})`,
            systemPrompt: this.getSystemPromptForType(options.agentType),
            tools: options.tools || this.getDefaultToolsForType(options.agentType),
            canSpawnAgents: false,
            memoryTypes: ['task', 'fact'],
            type: 'spawned',
            parentAgentId: options.parentAgentId || 'ora',
            taskId,
            expiresAt: options.expiresInMinutes
                ? new Date(Date.now() + options.expiresInMinutes * 60 * 1000).toISOString()
                : undefined,
            createdAt: new Date().toISOString()
        };
        
        // Create database
        await siteManager.createAgentDatabase(options.siteSlug, agentSlug);
        
        // Store task context
        const db = siteManager.openAgentDb(options.siteSlug, agentSlug);
        db.prepare(`
            INSERT INTO task_context (id, task_description, status, created_at)
            VALUES (?, ?, 'active', ?)
        `).run(taskId, options.taskDescription, new Date().toISOString());
        db.close();
        
        return agent;
    }
    
    /**
     * Complete a spawned agent and cleanup
     */
    async completeAgent(
        siteSlug: string,
        agentSlug: string,
        options: {
            extractMemories?: boolean;
            extractTo?: string;
            deleteImmediately?: boolean;
        } = {}
    ): Promise<{ extracted: number }> {
        const {
            extractMemories = true,
            extractTo = 'ora',
            deleteImmediately = false
        } = options;
        
        let extracted = 0;
        
        if (extractMemories) {
            extracted = await this.extractMemories(siteSlug, agentSlug, extractTo);
        }
        
        const sitesPath = path.join(os.homedir(), '.ora', 'sites');
        const dbPath = path.join(sitesPath, siteSlug, `${agentSlug}.site.db`);
        
        if (deleteImmediately) {
            await fs.unlink(dbPath);
        } else {
            const backupPath = path.join(sitesPath, siteSlug, 'backups', `${agentSlug}.site.db.bak`);
            await fs.rename(dbPath, backupPath);
            // Schedule deletion after 7 days
            this.scheduleBackupDeletion(backupPath, 7);
        }
        
        return { extracted };
    }
    
    /**
     * Extract important memories to target agent
     */
    private async extractMemories(
        siteSlug: string,
        sourceSlug: string,
        targetSlug: string
    ): Promise<number> {
        const sourceDb = siteManager.openAgentDb(siteSlug, sourceSlug);
        const targetDb = siteManager.openAgentDb(siteSlug, targetSlug);
        
        const memories = sourceDb.prepare(`
            SELECT * FROM memories
            WHERE importance >= 7
               OR (type = 'fact' AND health_score >= 0.5)
            ORDER BY importance DESC
            LIMIT 50
        `).all();
        
        const insert = targetDb.prepare(`
            INSERT OR IGNORE INTO memories
            (id, content, type, importance, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        let copied = 0;
        for (const mem of memories) {
            insert.run(
                `extracted-${mem.id}`,
                `[From ${sourceSlug}] ${mem.content}`,
                mem.type,
                mem.importance,
                mem.created_at,
                new Date().toISOString()
            );
            copied++;
        }
        
        sourceDb.close();
        targetDb.close();
        
        return copied;
    }
    
    /**
     * Schedule backup file deletion
     */
    private scheduleBackupDeletion(filePath: string, days: number): void {
        const ms = days * 24 * 60 * 60 * 1000;
        setTimeout(async () => {
            try {
                await fs.unlink(filePath);
                console.log(`Deleted backup: ${filePath}`);
            } catch {}
        }, ms);
    }
}

export const agentSpawner = new AgentSpawner();
```

---

## 3. ToolRegistry

Dynamically registers and executes tools from site schemas.

```typescript
// src/services/tool-registry.ts

import { siteManager } from './site-manager';
import * as crypto from 'crypto';

interface Tool {
    name: string;
    description: string;
    parameters: Record<string, any>;
    handler: (params: any, context: ToolContext) => Promise<any>;
}

interface ToolContext {
    siteSlug: string;
    agentSlug: string;
    conversationId?: string;
}

export class ToolRegistry {
    private siteTools: Map<string, Tool[]> = new Map();
    private allTools: Map<string, Tool> = new Map();
    
    /**
     * Register tools from a site's schema
     */
    async registerSiteTools(siteSlug: string, schema: ApiSchema): Promise<void> {
        const tools: Tool[] = [];
        
        // Create tool for each action in schema
        for (const [actionName, actionDef] of Object.entries(schema.actions)) {
            const tool: Tool = {
                name: `${siteSlug}.${actionName}`,
                description: actionDef.description,
                parameters: actionDef.params,
                handler: async (params, context) => {
                    return await this.executeRemoteAction(siteSlug, actionName, params);
                }
            };
            tools.push(tool);
            this.allTools.set(tool.name, tool);
        }
        
        // Add memory tools for this site
        tools.push(this.createMemoryStoreTool(siteSlug));
        tools.push(this.createMemoryRecallTool(siteSlug));
        
        this.siteTools.set(siteSlug, tools);
        console.log(`Registered ${tools.length} tools for ${siteSlug}`);
    }
    
    /**
     * Unregister all tools for a site
     */
    unregisterSiteTools(siteSlug: string): void {
        const tools = this.siteTools.get(siteSlug);
        if (tools) {
            for (const tool of tools) {
                this.allTools.delete(tool.name);
            }
            this.siteTools.delete(siteSlug);
        }
    }
    
    /**
     * Execute a remote action on a site
     */
    private async executeRemoteAction(
        siteSlug: string,
        action: string,
        params: any
    ): Promise<any> {
        const config = await siteManager.getSiteConfig(siteSlug);
        const secret = await siteManager.decryptSecret(config.secret);
        
        const response = await fetch(`${config.url}${config.apiEndpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secret}`
            },
            body: JSON.stringify({ action, data: params })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error?.message || 'Action failed');
        }
        
        return result.data;
    }
    
    /**
     * Create memory.store tool for a site
     */
    private createMemoryStoreTool(siteSlug: string): Tool {
        return {
            name: `${siteSlug}.memory.store`,
            description: `Store a memory about ${siteSlug}`,
            parameters: {
                content: { type: 'string', required: true },
                type: { type: 'string', enum: ['fact', 'preference', 'context', 'task'] },
                importance: { type: 'number', min: 1, max: 10, default: 5 }
            },
            handler: async (params, context) => {
                const db = siteManager.openAgentDb(siteSlug, context.agentSlug || 'ora');
                const id = crypto.randomUUID();
                const now = new Date().toISOString();
                
                db.prepare(`
                    INSERT INTO memories (id, content, type, importance, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(id, params.content, params.type || 'fact', params.importance || 5, now, now);
                
                db.close();
                return { stored: true, id };
            }
        };
    }
    
    /**
     * Create memory.recall tool for a site
     */
    private createMemoryRecallTool(siteSlug: string): Tool {
        return {
            name: `${siteSlug}.memory.recall`,
            description: `Recall memories about ${siteSlug}`,
            parameters: {
                query: { type: 'string', required: false },
                type: { type: 'string', enum: ['fact', 'preference', 'context', 'task'] },
                limit: { type: 'number', default: 10 }
            },
            handler: async (params, context) => {
                const db = siteManager.openAgentDb(siteSlug, context.agentSlug || 'ora');
                
                let sql = 'SELECT * FROM memories WHERE health_score > 0.3';
                const sqlParams: any[] = [];
                
                if (params.type) {
                    sql += ' AND type = ?';
                    sqlParams.push(params.type);
                }
                
                sql += ' ORDER BY importance DESC, created_at DESC LIMIT ?';
                sqlParams.push(params.limit || 10);
                
                const memories = db.prepare(sql).all(...sqlParams);
                
                // Update access stats
                for (const mem of memories) {
                    db.prepare(`
                        UPDATE memories SET
                            access_count = access_count + 1,
                            last_accessed_at = ?,
                            health_score = MIN(1.0, health_score + 0.05)
                        WHERE id = ?
                    `).run(new Date().toISOString(), mem.id);
                }
                
                db.close();
                return memories;
            }
        };
    }
    
    /**
     * Get all tools for LLM
     */
    getAllTools(): Tool[] {
        return Array.from(this.allTools.values());
    }
    
    /**
     * Get tools for a specific site
     */
    getToolsForSite(siteSlug: string): Tool[] {
        return this.siteTools.get(siteSlug) || [];
    }
    
    /**
     * Execute a tool by name
     */
    async executeTool(name: string, params: any, context: ToolContext): Promise<any> {
        const tool = this.allTools.get(name);
        if (!tool) {
            throw new Error(`Unknown tool: ${name}`);
        }
        return await tool.handler(params, context);
    }
}

export const toolRegistry = new ToolRegistry();
```
