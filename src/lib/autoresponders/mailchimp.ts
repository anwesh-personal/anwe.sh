/**
 * Mailchimp Integration
 * Uses Mailchimp Marketing API v3
 * https://mailchimp.com/developer/marketing/api/
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

export class MailchimpProvider implements AutoresponderProvider {
    /**
     * Extract datacenter from API key
     * API key format: key-dc (e.g., abc123def456-us14)
     */
    private getDatacenter(apiKey: string): string {
        const parts = apiKey.split('-');
        return parts[parts.length - 1] || 'us1';
    }

    /**
     * Get base URL for API calls
     */
    private getBaseUrl(apiKey: string): string {
        const dc = this.getDatacenter(apiKey);
        return `https://${dc}.api.mailchimp.com/3.0`;
    }

    /**
     * Make authenticated API request
     */
    private async request<T>(
        apiKey: string,
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const baseUrl = this.getBaseUrl(apiKey);
        const url = `${baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.title || 'Mailchimp API error');
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
            const data = await this.request<{ account_name: string; email: string }>(
                config.apiKey,
                '/'
            );

            return {
                valid: true,
                accountName: data.account_name,
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
     * Fetch available lists/audiences
     */
    async getLists(config: AutoresponderConfig): Promise<ListInfo[]> {
        if (!config.apiKey) {
            throw new Error('API key is required');
        }

        interface MailchimpList {
            id: string;
            name: string;
            stats: { member_count: number };
            date_created: string;
        }

        const data = await this.request<{ lists: MailchimpList[] }>(
            config.apiKey,
            '/lists?count=100'
        );

        return data.lists.map(list => ({
            id: list.id,
            name: list.name,
            subscriberCount: list.stats.member_count,
            dateCreated: list.date_created,
        }));
    }

    /**
     * Mailchimp doesn't have forms in the traditional sense
     * But we can return signup forms embedded info
     */
    async getForms(config: AutoresponderConfig): Promise<FormInfo[]> {
        if (!config.apiKey || !config.defaultListId) {
            return [];
        }

        // Mailchimp has signup forms per list
        return [{
            id: 'embedded',
            name: 'Embedded Signup Form',
            type: 'embedded',
        }, {
            id: 'popup',
            name: 'Popup Signup Form',
            type: 'popup',
        }];
    }

    /**
     * Fetch tags for a list
     */
    async getTags(config: AutoresponderConfig): Promise<TagInfo[]> {
        if (!config.apiKey || !config.defaultListId) {
            return [];
        }

        interface MailchimpTag {
            id: number;
            name: string;
        }

        try {
            const data = await this.request<{ tags: MailchimpTag[] }>(
                config.apiKey,
                `/lists/${config.defaultListId}/tag-search?count=100`
            );

            return data.tags.map(tag => ({
                id: String(tag.id),
                name: tag.name,
            }));
        } catch {
            // Tags endpoint may not exist for some accounts
            return [];
        }
    }

    /**
     * Fetch campaigns
     */
    async getCampaigns(config: AutoresponderConfig): Promise<CampaignInfo[]> {
        if (!config.apiKey) {
            return [];
        }

        interface MailchimpCampaign {
            id: string;
            settings: { title: string };
            status: string;
            type: string;
            send_time: string;
        }

        try {
            const data = await this.request<{ campaigns: MailchimpCampaign[] }>(
                config.apiKey,
                '/campaigns?count=50&sort_field=send_time&sort_dir=DESC'
            );

            return data.campaigns.map(campaign => ({
                id: campaign.id,
                name: campaign.settings.title,
                status: campaign.status,
                type: campaign.type,
                sentAt: campaign.send_time,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Subscribe an email address to a list
     */
    async subscribe(config: AutoresponderConfig, data: SubscribeData): Promise<SubscribeResult> {
        if (!config.apiKey) {
            return { success: false, error: 'API key is required' };
        }

        const listId = data.listId || config.defaultListId;
        if (!listId) {
            return { success: false, error: 'List ID is required' };
        }

        try {
            // Prepare merge fields
            const mergeFields: Record<string, string> = {};

            if (data.firstName) mergeFields.FNAME = data.firstName;
            if (data.lastName) mergeFields.LNAME = data.lastName;
            if (data.name && !data.firstName) {
                const parts = data.name.split(' ');
                mergeFields.FNAME = parts[0];
                if (parts.length > 1) {
                    mergeFields.LNAME = parts.slice(1).join(' ');
                }
            }
            if (data.phone) mergeFields.PHONE = data.phone;
            if (data.company) mergeFields.COMPANY = data.company;

            // Add custom fields
            if (data.customFields) {
                Object.assign(mergeFields, data.customFields);
            }

            // Prepare request body
            const body: Record<string, unknown> = {
                email_address: data.email,
                status: 'subscribed',  // or 'pending' for double opt-in
                merge_fields: mergeFields,
            };

            // Add tags if provided
            if (data.tags && data.tags.length > 0) {
                body.tags = data.tags;
            }

            interface SubscribeResponse {
                id: string;
                email_address: string;
            }

            const result = await this.request<SubscribeResponse>(
                config.apiKey,
                `/lists/${listId}/members`,
                {
                    method: 'POST',
                    body: JSON.stringify(body),
                }
            );

            return {
                success: true,
                subscriberId: result.id,
                message: 'Successfully subscribed',
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Subscription failed';

            // Check for "already subscribed" error
            if (errorMessage.toLowerCase().includes('already a list member')) {
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
            this.getForms(config).catch(() => []),
            this.getTags(config).catch(() => []),
            this.getCampaigns(config).catch(() => []),
        ]);

        return { lists, forms, tags, campaigns };
    }
}
