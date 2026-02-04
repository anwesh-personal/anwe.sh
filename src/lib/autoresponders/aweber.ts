/**
 * AWeber Integration
 * Uses AWeber API v1 with OAuth 2.0
 * https://api.aweber.com/
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

const BASE_URL = 'https://api.aweber.com/1.0';
const AUTH_URL = 'https://auth.aweber.com/oauth2';

export class AWeberProvider implements AutoresponderProvider {
    /**
     * Get OAuth authorization URL
     */
    getAuthUrl(clientId: string, redirectUri: string, state?: string): string {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: 'account.read list.read list.write subscriber.read subscriber.write',
        });

        if (state) {
            params.append('state', state);
        }

        return `${AUTH_URL}/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCode(
        clientId: string,
        clientSecret: string,
        code: string,
        redirectUri: string
    ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
        const response = await fetch(`${AUTH_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || data.error || 'Failed to exchange code');
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
        };
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(
        clientId: string,
        clientSecret: string,
        refreshToken: string
    ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
        const response = await fetch(`${AUTH_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || data.error || 'Failed to refresh token');
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
        };
    }

    /**
     * Make authenticated API request
     */
    private async request<T>(
        accessToken: string,
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || data.error || 'AWeber API error');
        }

        return data as T;
    }

    /**
     * Get account ID
     */
    private async getAccountId(accessToken: string): Promise<string> {
        interface AccountsResponse {
            entries: Array<{ id: number }>;
        }

        const data = await this.request<AccountsResponse>(accessToken, '/accounts');

        if (!data.entries || data.entries.length === 0) {
            throw new Error('No AWeber account found');
        }

        return String(data.entries[0].id);
    }

    /**
     * Validate API credentials
     */
    async validateCredentials(config: AutoresponderConfig): Promise<ValidationResult> {
        if (!config.accessToken) {
            return { valid: false, error: 'OAuth connection required' };
        }

        try {
            const accountId = await this.getAccountId(config.accessToken);

            return {
                valid: true,
                accountName: `AWeber Account ${accountId}`,
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
        if (!config.accessToken) {
            throw new Error('OAuth connection required');
        }

        const accountId = await this.getAccountId(config.accessToken);

        interface AWeberList {
            id: number;
            name: string;
            total_subscribers: number;
        }

        interface ListsResponse {
            entries: AWeberList[];
        }

        const data = await this.request<ListsResponse>(
            config.accessToken,
            `/accounts/${accountId}/lists`
        );

        return data.entries.map(list => ({
            id: String(list.id),
            name: list.name,
            subscriberCount: list.total_subscribers,
        }));
    }

    /**
     * AWeber doesn't have forms in the API
     */
    async getForms(): Promise<FormInfo[]> {
        // AWeber forms are managed in their UI
        return [];
    }

    /**
     * Fetch tags for a list
     */
    async getTags(config: AutoresponderConfig): Promise<TagInfo[]> {
        if (!config.accessToken || !config.defaultListId) {
            return [];
        }

        const accountId = await this.getAccountId(config.accessToken);

        interface AWeberTag {
            name: string;
        }

        interface TagsResponse {
            entries: AWeberTag[];
        }

        try {
            const data = await this.request<TagsResponse>(
                config.accessToken,
                `/accounts/${accountId}/lists/${config.defaultListId}/tags`
            );

            return data.entries.map((tag, index) => ({
                id: String(index),
                name: tag.name,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Fetch campaigns/broadcasts
     */
    async getCampaigns(config: AutoresponderConfig): Promise<CampaignInfo[]> {
        if (!config.accessToken || !config.defaultListId) {
            return [];
        }

        const accountId = await this.getAccountId(config.accessToken);

        interface AWeberCampaign {
            id: number;
            subject: string;
            status: string;
            sent_at: string;
        }

        interface CampaignsResponse {
            entries: AWeberCampaign[];
        }

        try {
            const data = await this.request<CampaignsResponse>(
                config.accessToken,
                `/accounts/${accountId}/lists/${config.defaultListId}/campaigns`
            );

            return data.entries.map(campaign => ({
                id: String(campaign.id),
                name: campaign.subject,
                status: campaign.status,
                sentAt: campaign.sent_at,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Subscribe an email address
     */
    async subscribe(config: AutoresponderConfig, data: SubscribeData): Promise<SubscribeResult> {
        if (!config.accessToken) {
            return { success: false, error: 'OAuth connection required' };
        }

        const listId = data.listId || config.defaultListId;
        if (!listId) {
            return { success: false, error: 'List ID is required' };
        }

        try {
            const accountId = await this.getAccountId(config.accessToken);

            // Build subscriber data
            const subscriberData: Record<string, unknown> = {
                email: data.email,
                name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            };

            // Add custom fields
            if (data.customFields) {
                subscriberData.custom_fields = data.customFields;
            }

            // Add tags
            if (data.tags && data.tags.length > 0) {
                subscriberData.tags = data.tags;
            }

            interface SubscribeResponse {
                id: number;
            }

            const result = await this.request<SubscribeResponse>(
                config.accessToken,
                `/accounts/${accountId}/lists/${listId}/subscribers`,
                {
                    method: 'POST',
                    body: JSON.stringify(subscriberData),
                }
            );

            return {
                success: true,
                subscriberId: String(result.id),
                message: 'Successfully subscribed',
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Subscription failed';

            if (errorMessage.toLowerCase().includes('already subscribed')) {
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
            this.getTags(config).catch(() => []),
            this.getCampaigns(config).catch(() => []),
        ]);

        return { lists, forms, tags, campaigns };
    }
}
