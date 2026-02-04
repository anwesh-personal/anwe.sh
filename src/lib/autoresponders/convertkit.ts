/**
 * ConvertKit Integration
 * Uses ConvertKit API v3
 * https://developers.convertkit.com/
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

const BASE_URL = 'https://api.convertkit.com/v3';

export class ConvertKitProvider implements AutoresponderProvider {
    /**
     * Make authenticated API request
     */
    private async request<T>(
        apiKey: string,
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;
        const separator = endpoint.includes('?') ? '&' : '?';
        const urlWithKey = `${url}${separator}api_key=${apiKey}`;

        const response = await fetch(urlWithKey, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'ConvertKit API error');
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
                name: string;
                primary_email_address: string;
            }

            const data = await this.request<AccountResponse>(
                config.apiKey,
                '/account'
            );

            return {
                valid: true,
                accountName: data.name,
                email: data.primary_email_address,
            };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Failed to validate credentials',
            };
        }
    }

    /**
     * ConvertKit doesn't have traditional lists
     * Subscribers are tagged or added via forms
     * We return a placeholder for compatibility
     */
    async getLists(config: AutoresponderConfig): Promise<ListInfo[]> {
        // ConvertKit uses forms and tags instead of lists
        const forms = await this.getForms(config);

        // Convert forms to list-like structure for UI consistency
        return forms.map(form => ({
            id: form.id,
            name: form.name,
            subscriberCount: undefined,
        }));
    }

    /**
     * Fetch available forms
     */
    async getForms(config: AutoresponderConfig): Promise<FormInfo[]> {
        if (!config.apiKey) {
            throw new Error('API key is required');
        }

        interface ConvertKitForm {
            id: number;
            name: string;
            type: string;
            embed_url: string;
        }

        const data = await this.request<{ forms: ConvertKitForm[] }>(
            config.apiKey,
            '/forms'
        );

        return data.forms.map(form => ({
            id: String(form.id),
            name: form.name,
            type: form.type,
            embedUrl: form.embed_url,
        }));
    }

    /**
     * Fetch available tags
     */
    async getTags(config: AutoresponderConfig): Promise<TagInfo[]> {
        if (!config.apiKey) {
            throw new Error('API key is required');
        }

        interface ConvertKitTag {
            id: number;
            name: string;
        }

        const data = await this.request<{ tags: ConvertKitTag[] }>(
            config.apiKey,
            '/tags'
        );

        return data.tags.map(tag => ({
            id: String(tag.id),
            name: tag.name,
        }));
    }

    /**
     * Fetch sequences (email courses/automations)
     */
    async getCampaigns(config: AutoresponderConfig): Promise<CampaignInfo[]> {
        if (!config.apiKey) {
            return [];
        }

        interface ConvertKitSequence {
            id: number;
            name: string;
        }

        try {
            const data = await this.request<{ courses: ConvertKitSequence[] }>(
                config.apiKey,
                '/sequences'
            );

            return data.courses.map(seq => ({
                id: String(seq.id),
                name: seq.name,
                status: 'active',
                type: 'sequence',
            }));
        } catch {
            return [];
        }
    }

    /**
     * Subscribe an email address
     * Can subscribe to a form or tag a subscriber
     */
    async subscribe(config: AutoresponderConfig, data: SubscribeData): Promise<SubscribeResult> {
        if (!config.apiKey) {
            return { success: false, error: 'API key is required' };
        }

        const formId = data.formId || config.defaultFormId;

        try {
            // Prepare request body
            const body: Record<string, unknown> = {
                api_key: config.apiKey,
                email: data.email,
            };

            // Add first name
            if (data.firstName) {
                body.first_name = data.firstName;
            } else if (data.name) {
                body.first_name = data.name.split(' ')[0];
            }

            // Add custom fields
            if (data.customFields) {
                body.fields = data.customFields;
            }

            // Add tags
            if (data.tags && data.tags.length > 0) {
                body.tags = data.tags.map(t => parseInt(t));
            }

            let result: { subscription: { id: number; subscriber: { id: number } } };

            if (formId) {
                // Subscribe via form
                result = await this.request(
                    config.apiKey,
                    `/forms/${formId}/subscribe`,
                    {
                        method: 'POST',
                        body: JSON.stringify(body),
                    }
                );
            } else if (data.tags && data.tags.length > 0) {
                // Subscribe via tag
                const tagId = data.tags[0];
                result = await this.request(
                    config.apiKey,
                    `/tags/${tagId}/subscribe`,
                    {
                        method: 'POST',
                        body: JSON.stringify(body),
                    }
                );
            } else {
                return {
                    success: false,
                    error: 'Form ID or Tag ID is required'
                };
            }

            return {
                success: true,
                subscriberId: String(result.subscription?.subscriber?.id || result.subscription?.id),
                message: 'Successfully subscribed',
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Subscription failed';

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
