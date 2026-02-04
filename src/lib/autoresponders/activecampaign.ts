/**
 * ActiveCampaign Integration
 * Uses ActiveCampaign API v3
 * https://developers.activecampaign.com/
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

export class ActiveCampaignProvider implements AutoresponderProvider {
    /**
     * Make authenticated API request
     */
    private async request<T>(
        apiUrl: string,
        apiKey: string,
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        // Ensure URL doesn't have trailing slash
        const baseUrl = apiUrl.replace(/\/$/, '');
        const url = `${baseUrl}/api/3${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Api-Token': apiKey,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.errors?.[0]?.title || 'ActiveCampaign API error');
        }

        return data as T;
    }

    /**
     * Validate API credentials
     */
    async validateCredentials(config: AutoresponderConfig): Promise<ValidationResult> {
        if (!config.apiKey || !config.apiUrl) {
            return { valid: false, error: 'API URL and Key are required' };
        }

        try {
            interface AccountResponse {
                account: {
                    account: string;
                    email: string;
                };
            }

            const data = await this.request<AccountResponse>(
                config.apiUrl,
                config.apiKey,
                '/users/me'
            );

            return {
                valid: true,
                accountName: data.account?.account,
                email: data.account?.email,
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
        if (!config.apiKey || !config.apiUrl) {
            throw new Error('API URL and Key are required');
        }

        interface ACList {
            id: string;
            name: string;
            subscriber_count: number;
            cdate: string;
        }

        const data = await this.request<{ lists: ACList[] }>(
            config.apiUrl,
            config.apiKey,
            '/lists?limit=100'
        );

        return data.lists.map(list => ({
            id: list.id,
            name: list.name,
            subscriberCount: list.subscriber_count,
            dateCreated: list.cdate,
        }));
    }

    /**
     * Fetch available forms
     */
    async getForms(config: AutoresponderConfig): Promise<FormInfo[]> {
        if (!config.apiKey || !config.apiUrl) {
            return [];
        }

        interface ACForm {
            id: string;
            name: string;
        }

        try {
            const data = await this.request<{ forms: ACForm[] }>(
                config.apiUrl,
                config.apiKey,
                '/forms?limit=100'
            );

            return data.forms.map(form => ({
                id: form.id,
                name: form.name,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Fetch available tags
     */
    async getTags(config: AutoresponderConfig): Promise<TagInfo[]> {
        if (!config.apiKey || !config.apiUrl) {
            return [];
        }

        interface ACTag {
            id: string;
            tag: string;
            subscriber_count: string;
        }

        try {
            const data = await this.request<{ tags: ACTag[] }>(
                config.apiUrl,
                config.apiKey,
                '/tags?limit=100'
            );

            return data.tags.map(tag => ({
                id: tag.id,
                name: tag.tag,
                subscriberCount: parseInt(tag.subscriber_count) || 0,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Fetch campaigns
     */
    async getCampaigns(config: AutoresponderConfig): Promise<CampaignInfo[]> {
        if (!config.apiKey || !config.apiUrl) {
            return [];
        }

        interface ACCampaign {
            id: string;
            name: string;
            status: number;
            type: string;
            sdate: string;
        }

        try {
            const data = await this.request<{ campaigns: ACCampaign[] }>(
                config.apiUrl,
                config.apiKey,
                '/campaigns?limit=50&orders[sdate]=DESC'
            );

            const statusMap: Record<number, string> = {
                0: 'draft',
                1: 'scheduled',
                2: 'sending',
                3: 'paused',
                4: 'stopped',
                5: 'completed',
            };

            return data.campaigns.map(campaign => ({
                id: campaign.id,
                name: campaign.name,
                status: statusMap[campaign.status] || 'unknown',
                type: campaign.type,
                sentAt: campaign.sdate,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Subscribe an email address
     */
    async subscribe(config: AutoresponderConfig, data: SubscribeData): Promise<SubscribeResult> {
        if (!config.apiKey || !config.apiUrl) {
            return { success: false, error: 'API URL and Key are required' };
        }

        const listId = data.listId || config.defaultListId;
        if (!listId) {
            return { success: false, error: 'List ID is required' };
        }

        try {
            // Step 1: Create or update contact
            const contactBody: Record<string, unknown> = {
                contact: {
                    email: data.email,
                    firstName: data.firstName || data.name?.split(' ')[0] || '',
                    lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
                    phone: data.phone || '',
                },
            };

            interface ContactResponse {
                contact: { id: string };
            }

            const contactResult = await this.request<ContactResponse>(
                config.apiUrl,
                config.apiKey,
                '/contacts',
                {
                    method: 'POST',
                    body: JSON.stringify(contactBody),
                }
            );

            const contactId = contactResult.contact.id;

            // Step 2: Add to list
            const listBody = {
                contactList: {
                    list: listId,
                    contact: contactId,
                    status: 1, // Active
                },
            };

            await this.request(
                config.apiUrl,
                config.apiKey,
                '/contactLists',
                {
                    method: 'POST',
                    body: JSON.stringify(listBody),
                }
            );

            // Step 3: Add tags if provided
            if (data.tags && data.tags.length > 0) {
                for (const tagId of data.tags) {
                    await this.request(
                        config.apiUrl,
                        config.apiKey,
                        '/contactTags',
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                contactTag: {
                                    contact: contactId,
                                    tag: tagId,
                                },
                            }),
                        }
                    ).catch(() => {/* Ignore tag errors */ });
                }
            }

            return {
                success: true,
                subscriberId: contactId,
                message: 'Successfully subscribed',
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Subscription failed';

            // Check for duplicate
            if (errorMessage.toLowerCase().includes('duplicate')) {
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
