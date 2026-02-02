/**
 * ANWE.SH Type Definitions
 * Central types for all entities
 */

// ============================================
// AGENTS
// ============================================

export type AgentType =
    | 'orchestrator'
    | 'content'
    | 'visual'
    | 'optimization'
    | 'distribution'
    | 'analytics'
    | 'custom';

export type AgentProvider = 'openai' | 'anthropic' | 'google' | 'custom';

export type AgentStatus = 'active' | 'idle' | 'disabled' | 'error' | 'scheduled';

export type AgentRunStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled';

export type AgentTrigger = 'manual' | 'scheduled' | 'agent' | 'webhook' | 'system';

export interface Agent {
    id: string;
    name: string;
    slug: string;
    type: AgentType;
    description: string | null;
    icon: string;

    // AI Configuration
    model: string;
    provider: AgentProvider;
    config: Record<string, unknown>;
    system_prompt: string | null;

    // Status
    status: AgentStatus;
    status_message: string | null;

    // Stats
    last_run_at: string | null;
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    avg_duration_ms: number | null;

    // Settings
    is_public: boolean;
    is_enabled: boolean;
    rate_limit_per_hour: number | null;

    // Timestamps
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
}

export interface AgentRun {
    id: string;
    agent_id: string;

    // Run details
    action: string;
    input: Record<string, unknown> | null;
    output: Record<string, unknown> | null;

    // Status
    status: AgentRunStatus;
    error_message: string | null;

    // Performance
    duration_ms: number | null;
    tokens_used: number | null;
    estimated_cost: number | null;

    // Context
    triggered_by: AgentTrigger | null;
    parent_run_id: string | null;
    post_id: string | null;

    // Timestamps
    started_at: string;
    completed_at: string | null;
    created_at: string;

    // Joined data
    agent?: Agent;
}

export interface AgentCreateInput {
    name: string;
    slug: string;
    type: AgentType;
    description?: string;
    icon?: string;
    model: string;
    provider: AgentProvider;
    config?: Record<string, unknown>;
    system_prompt?: string;
    is_enabled?: boolean;
    rate_limit_per_hour?: number;
}

export interface AgentUpdateInput extends Partial<AgentCreateInput> {
    status?: AgentStatus;
    status_message?: string;
}

// ============================================
// ANALYTICS
// ============================================

export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'bot' | 'unknown';

export interface PageView {
    id: string;
    path: string;
    title: string | null;

    // Source
    referrer: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;

    // Visitor
    session_id: string | null;
    visitor_hash: string | null;

    // Device
    user_agent: string | null;
    device_type: DeviceType | null;
    browser: string | null;
    os: string | null;

    // Location
    country: string | null;
    country_code: string | null;
    region: string | null;
    city: string | null;

    // Performance
    load_time_ms: number | null;

    // Engagement
    time_on_page_seconds: number | null;
    scroll_depth_percent: number | null;

    // Related
    post_id: string | null;

    created_at: string;
}

export interface AnalyticsDaily {
    id: string;
    date: string;

    total_views: number;
    unique_visitors: number;
    unique_sessions: number;

    page_stats: Record<string, number>;
    source_stats: Record<string, number>;
    device_stats: Record<string, number>;
    country_stats: Record<string, number>;

    avg_time_on_page_seconds: number | null;
    avg_scroll_depth_percent: number | null;
    bounce_rate_percent: number | null;

    created_at: string;
    updated_at: string;
}

export interface AnalyticsSummary {
    totalViews: number;
    uniqueVisitors: number;
    avgSessionDuration: number;
    bounceRate: number;
    topPages: Array<{ path: string; views: number; change: number }>;
    topSources: Array<{ source: string; visitors: number; percent: number }>;
    deviceBreakdown: Record<DeviceType, number>;
    dailyViews: Array<{ date: string; views: number }>;
}

// ============================================
// BLOCK EDITOR
// ============================================

export type BlockType =
    | 'paragraph'
    | 'heading'
    | 'image'
    | 'code'
    | 'quote'
    | 'callout'
    | 'divider'
    | 'list'
    | 'table'
    | 'embed'
    | 'html';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type CalloutType = 'info' | 'warning' | 'tip' | 'danger';

export type ListType = 'bullet' | 'numbered' | 'checklist';

export interface BaseBlock {
    id: string;
    type: BlockType;
}

export interface ParagraphBlock extends BaseBlock {
    type: 'paragraph';
    content: string;
}

export interface HeadingBlock extends BaseBlock {
    type: 'heading';
    level: HeadingLevel;
    content: string;
}

export interface ImageBlock extends BaseBlock {
    type: 'image';
    url: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
}

export interface CodeBlock extends BaseBlock {
    type: 'code';
    language: string;
    content: string;
    filename?: string;
}

export interface QuoteBlock extends BaseBlock {
    type: 'quote';
    content: string;
    author?: string;
    source?: string;
}

export interface CalloutBlock extends BaseBlock {
    type: 'callout';
    calloutType: CalloutType;
    title?: string;
    content: string;
}

export interface DividerBlock extends BaseBlock {
    type: 'divider';
}

export interface ListBlock extends BaseBlock {
    type: 'list';
    listType: ListType;
    items: Array<{
        content: string;
        checked?: boolean; // For checklist
    }>;
}

export interface TableBlock extends BaseBlock {
    type: 'table';
    headers: string[];
    rows: string[][];
}

export interface EmbedBlock extends BaseBlock {
    type: 'embed';
    url: string;
    embedType: 'youtube' | 'twitter' | 'vimeo' | 'codepen' | 'other';
}

export interface HtmlBlock extends BaseBlock {
    type: 'html';
    content: string;
}

export type Block =
    | ParagraphBlock
    | HeadingBlock
    | ImageBlock
    | CodeBlock
    | QuoteBlock
    | CalloutBlock
    | DividerBlock
    | ListBlock
    | TableBlock
    | EmbedBlock
    | HtmlBlock;

export interface EditorState {
    blocks: Block[];
    selectedBlockId: string | null;
    focusedBlockId: string | null;
    isDragging: boolean;
    isPreview: boolean;
}

// ============================================
// SITE SETTINGS
// ============================================

export interface SiteSettings {
    // General
    siteName: string;
    siteTagline: string;
    siteDescription: string;
    siteLogo: string | null;
    siteFavicon: string | null;

    // Theme
    theme: string;

    // SEO
    defaultMetaTitle: string;
    defaultMetaDescription: string;
    defaultOgImage: string | null;
    robotsTxt: string;

    // Social
    socialTwitter: string | null;
    socialLinkedin: string | null;
    socialGithub: string | null;
    socialYoutube: string | null;

    // Integrations
    googleAnalyticsId: string | null;
    vercelAnalyticsEnabled: boolean;
    customHeadCode: string | null;
    customBodyCode: string | null;
}
