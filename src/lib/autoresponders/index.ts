/**
 * Autoresponder Integration Library
 * Factory and common types for all email marketing providers
 */

// =====================================================
// TYPES
// =====================================================

export type ProviderType = 'mailchimp' | 'convertkit' | 'activecampaign' | 'aweber' | 'brevo' | 'custom';

export interface AutoresponderConfig {
    provider: ProviderType;
    apiKey?: string;
    apiSecret?: string;
    apiUrl?: string;
    accessToken?: string;
    refreshToken?: string;
    defaultListId?: string;
    defaultFormId?: string;
    defaultTagIds?: string[];
    // Custom provider settings
    customSubscribeUrl?: string;
    customEmailField?: string;
    customNameField?: string;
    customHeaders?: Record<string, string>;
    customBodyTemplate?: Record<string, unknown>;
}

export interface ListInfo {
    id: string;
    name: string;
    subscriberCount?: number;
    dateCreated?: string;
}

export interface FormInfo {
    id: string;
    name: string;
    type?: string;
    embedUrl?: string;
}

export interface TagInfo {
    id: string;
    name: string;
    subscriberCount?: number;
}

export interface CampaignInfo {
    id: string;
    name: string;
    status: string;
    type?: string;
    sentAt?: string;
}

export interface SubscribeData {
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    company?: string;
    customFields?: Record<string, string>;
    tags?: string[];
    listId?: string;
    formId?: string;
}

export interface SubscribeResult {
    success: boolean;
    subscriberId?: string;
    message?: string;
    error?: string;
    errorCode?: string;
    alreadySubscribed?: boolean;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
    accountName?: string;
    email?: string;
}

export interface ProviderData {
    lists: ListInfo[];
    forms: FormInfo[];
    tags: TagInfo[];
    campaigns: CampaignInfo[];
}

// =====================================================
// PROVIDER INTERFACE
// =====================================================

export interface AutoresponderProvider {
    /**
     * Validate API credentials
     */
    validateCredentials(config: AutoresponderConfig): Promise<ValidationResult>;

    /**
     * Fetch available lists/audiences
     */
    getLists(config: AutoresponderConfig): Promise<ListInfo[]>;

    /**
     * Fetch available forms (if supported)
     */
    getForms?(config: AutoresponderConfig): Promise<FormInfo[]>;

    /**
     * Fetch available tags (if supported)
     */
    getTags?(config: AutoresponderConfig): Promise<TagInfo[]>;

    /**
     * Fetch campaigns (if supported)
     */
    getCampaigns?(config: AutoresponderConfig): Promise<CampaignInfo[]>;

    /**
     * Subscribe an email address
     */
    subscribe(config: AutoresponderConfig, data: SubscribeData): Promise<SubscribeResult>;

    /**
     * Fetch all available data from provider
     */
    fetchAllData(config: AutoresponderConfig): Promise<ProviderData>;
}

// =====================================================
// PROVIDER FACTORY
// =====================================================

import { MailchimpProvider } from './mailchimp';
import { ConvertKitProvider } from './convertkit';
import { ActiveCampaignProvider } from './activecampaign';
import { AWeberProvider } from './aweber';
import { BrevoProvider } from './brevo';
import { CustomProvider } from './custom';

const providers: Record<ProviderType, AutoresponderProvider> = {
    mailchimp: new MailchimpProvider(),
    convertkit: new ConvertKitProvider(),
    activecampaign: new ActiveCampaignProvider(),
    aweber: new AWeberProvider(),
    brevo: new BrevoProvider(),
    custom: new CustomProvider(),
};

export function getProvider(type: ProviderType): AutoresponderProvider {
    const provider = providers[type];
    if (!provider) {
        throw new Error(`Unknown provider: ${type}`);
    }
    return provider;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get human-readable provider name
 */
export function getProviderName(type: ProviderType): string {
    const names: Record<ProviderType, string> = {
        mailchimp: 'Mailchimp',
        convertkit: 'ConvertKit',
        activecampaign: 'ActiveCampaign',
        aweber: 'AWeber',
        brevo: 'Brevo',
        custom: 'Custom',
    };
    return names[type] || type;
}

/**
 * Get provider configuration requirements
 */
export function getProviderRequirements(type: ProviderType): {
    apiKey: boolean;
    apiUrl: boolean;
    oauth: boolean;
    description: string;
} {
    const requirements: Record<ProviderType, { apiKey: boolean; apiUrl: boolean; oauth: boolean; description: string }> = {
        mailchimp: {
            apiKey: true,
            apiUrl: false,
            oauth: false,
            description: 'Enter your Mailchimp API key (format: key-dc, e.g., abc123-us14)'
        },
        convertkit: {
            apiKey: true,
            apiUrl: false,
            oauth: false,
            description: 'Enter your ConvertKit API Key from Settings > Advanced'
        },
        activecampaign: {
            apiKey: true,
            apiUrl: true,
            oauth: false,
            description: 'Enter your API URL and Key from Settings > Developer'
        },
        aweber: {
            apiKey: false,
            apiUrl: false,
            oauth: true,
            description: 'Connect via OAuth - click Connect to authorize'
        },
        brevo: {
            apiKey: true,
            apiUrl: false,
            oauth: false,
            description: 'Enter your Brevo API Key from Settings > SMTP & API'
        },
        custom: {
            apiKey: false,
            apiUrl: true,
            oauth: false,
            description: 'Configure a custom webhook or API endpoint'
        },
    };
    return requirements[type];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
