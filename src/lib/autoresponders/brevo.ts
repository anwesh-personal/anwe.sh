/**
 * Brevo (formerly Sendinblue) Integration
 * Uses Brevo API v3
 * https://developers.brevo.com/
 */

import type {
    AutoresponderProvider,
    AutoresponderConfig,
    ValidationResult,
    ListInfo,
    FormInfo,
    TagInfo,
    CampaignInfo,
    SubscribeData,
    SubscribeResult,
    ProviderData,
} from './index';

const BASE_URL = 'https://api.brevo.com/v3';

export class BrevoProvider implements AutoresponderProvider {
    /**
     * Make authenticated API request
     */
    private async request<T>(
        apiKey: string,
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
        });

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Brevo API error');
        }

        return data as T;
    }

    /**
     * Validate API credentials
     */
    async validateCredentials(config: AutoresponderConfig): Promise<ValidationResult> {
        if (!config.apiKey) {
            return { valid: false, error: 'API key is required' };
        }

        try {
            interface AccountResponse {
                email: string;
                companyName: string;
            }

            const data = await this.request<AccountResponse>(
                config.apiKey,
                '/account'
            );

            return {
                valid: true,
                accountName: data.companyName,
                email: data.email,
            };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Failed to validate credentials',
            };
        }
    }

    /**
     * Fetch available lists
     */
    async getLists(config: AutoresponderConfig): Promise<ListInfo[]> {
        if (!config.apiKey) {
            throw new Error('API key is required');
        }

        interface BrevoList {
            id: number;
            name: string;
            totalSubscribers: number;
            createdAt: string;
        }

        interface ListsResponse {
            lists: BrevoList[];
        }

        const data = await this.request<ListsResponse>(
            config.apiKey,
            '/contacts/lists?limit=50'
        );

        return data.lists.map(list => ({
            id: String(list.id),
            name: list.name,
            subscriberCount: list.totalSubscribers,
            dateCreated: list.createdAt,
        }));
    }

    /**
     * Brevo doesn't have forms via API
     */
    async getForms(): Promise<FormInfo[]> {
        // Forms are managed in Brevo dashboard
        return [];
    }

    /**
     * Brevo doesn't have tags, but has attributes
     */
    async getTags(): Promise<TagInfo[]> {
        // Brevo uses contact attributes instead of tags
        return [];
    }

    /**
     * Fetch email campaigns
     */
    async getCampaigns(config: AutoresponderConfig): Promise<CampaignInfo[]> {
        if (!config.apiKey) {
            return [];
        }

        interface BrevoCampaign {
            id: number;
            name: string;
            status: string;
            type: string;
            sentDate: string;
        }

        interface CampaignsResponse {
            campaigns: BrevoCampaign[];
        }

        try {
            const data = await this.request<CampaignsResponse>(
                config.apiKey,
                '/emailCampaigns?limit=50&sort=desc'
            );

            return data.campaigns.map(campaign => ({
                id: String(campaign.id),
                name: campaign.name,
                status: campaign.status,
                type: campaign.type,
                sentAt: campaign.sentDate,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Subscribe an email address
     */
    async subscribe(config: AutoresponderConfig, data: SubscribeData): Promise<SubscribeResult> {
        if (!config.apiKey) {
            return { success: false, error: 'API key is required' };
        }

        const listId = data.listId || config.defaultListId;

        try {
            // Prepare contact data
            const contactData: Record<string, unknown> = {
                email: data.email,
                updateEnabled: true, // Update if contact exists
            };

            // Add attributes
            const attributes: Record<string, string> = {};

            if (data.firstName) attributes.FIRSTNAME = data.firstName;
            if (data.lastName) attributes.LASTNAME = data.lastName;
            if (data.name && !data.firstName) {
                const parts = data.name.split(' ');
                attributes.FIRSTNAME = parts[0];
                if (parts.length > 1) {
                    attributes.LASTNAME = parts.slice(1).join(' ');
                }
            }
            if (data.phone) attributes.SMS = data.phone;
            if (data.company) attributes.COMPANY = data.company;

            // Add custom fields
            if (data.customFields) {
                Object.assign(attributes, data.customFields);
            }

            if (Object.keys(attributes).length > 0) {
                contactData.attributes = attributes;
            }

            // Add to list(s)
            if (listId) {
                contactData.listIds = [parseInt(listId)];
            }

            interface CreateResponse {
                id: number;
            }

            const result = await this.request<CreateResponse>(
                config.apiKey,
                '/contacts',
                {
                    method: 'POST',
                    body: JSON.stringify(contactData),
                }
            );

            return {
                success: true,
                subscriberId: String(result.id),
                message: 'Successfully subscribed',
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Subscription failed';

            // Check for duplicate
            if (errorMessage.toLowerCase().includes('already exist') ||
                errorMessage.toLowerCase().includes('duplicate')) {
                return {
                    success: true,
                    alreadySubscribed: true,
                    message: 'Already subscribed',
                };
            }

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Fetch all available data from provider
     */
    async fetchAllData(config: AutoresponderConfig): Promise<ProviderData> {
        const [lists, forms, tags, campaigns] = await Promise.all([
            this.getLists(config).catch(() => []),
            this.getForms().catch(() => []),
            this.getTags().catch(() => []),
            this.getCampaigns(config).catch(() => []),
        ]);

        return { lists, forms, tags, campaigns };
    }
}
