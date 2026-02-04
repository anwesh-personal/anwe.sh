/**
 * Custom Autoresponder Integration
 * For generic webhooks or unsupported providers
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

export class CustomProvider implements AutoresponderProvider {
    /**
     * Validate custom configuration
     */
    async validateCredentials(config: AutoresponderConfig): Promise<ValidationResult> {
        if (!config.customSubscribeUrl) {
            return { valid: false, error: 'Subscribe URL is required' };
        }

        // Validate URL format
        try {
            new URL(config.customSubscribeUrl);
        } catch {
            return { valid: false, error: 'Invalid URL format' };
        }

        // Try a HEAD request to check if endpoint exists
        try {
            const response = await fetch(config.customSubscribeUrl, {
                method: 'HEAD',
                headers: config.customHeaders || {},
            });

            // Accept any 2xx, 4xx (might require POST), or 405 (method not allowed = endpoint exists)
            if (response.ok || response.status === 405 || response.status >= 400 && response.status < 500) {
                return {
                    valid: true,
                    accountName: 'Custom Integration',
                };
            }

            return {
                valid: false,
                error: `Endpoint returned ${response.status}`,
            };
        } catch (error) {
            // Network error, but URL might still be valid
            return {
                valid: true,
                accountName: 'Custom Integration (unverified)',
            };
        }
    }

    /**
     * Custom providers don't have lists
     */
    async getLists(): Promise<ListInfo[]> {
        return [];
    }

    /**
     * Custom providers don't have forms
     */
    async getForms(): Promise<FormInfo[]> {
        return [];
    }

    /**
     * Custom providers don't have tags
     */
    async getTags(): Promise<TagInfo[]> {
        return [];
    }

    /**
     * Custom providers don't have campaigns
     */
    async getCampaigns(): Promise<CampaignInfo[]> {
        return [];
    }

    /**
     * Subscribe via custom webhook
     */
    async subscribe(config: AutoresponderConfig, data: SubscribeData): Promise<SubscribeResult> {
        if (!config.customSubscribeUrl) {
            return { success: false, error: 'Subscribe URL is required' };
        }

        const emailField = config.customEmailField || 'email';
        const nameField = config.customNameField || 'name';

        try {
            // Build request body
            let body: Record<string, unknown>;

            if (config.customBodyTemplate && Object.keys(config.customBodyTemplate).length > 0) {
                // Use custom template with placeholder replacement
                body = JSON.parse(JSON.stringify(config.customBodyTemplate));

                // Replace placeholders
                const replacePlaceholders = (obj: Record<string, unknown>): void => {
                    for (const key in obj) {
                        if (typeof obj[key] === 'string') {
                            obj[key] = (obj[key] as string)
                                .replace('{{email}}', data.email)
                                .replace('{{name}}', data.name || '')
                                .replace('{{firstName}}', data.firstName || data.name?.split(' ')[0] || '')
                                .replace('{{lastName}}', data.lastName || data.name?.split(' ').slice(1).join(' ') || '')
                                .replace('{{phone}}', data.phone || '')
                                .replace('{{company}}', data.company || '');
                        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                            replacePlaceholders(obj[key] as Record<string, unknown>);
                        }
                    }
                };

                replacePlaceholders(body);
            } else {
                // Use default structure
                body = {
                    [emailField]: data.email,
                    [nameField]: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                };

                if (data.phone) body.phone = data.phone;
                if (data.company) body.company = data.company;
                if (data.customFields) {
                    Object.assign(body, data.customFields);
                }
            }

            const response = await fetch(config.customSubscribeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...config.customHeaders,
                },
                body: JSON.stringify(body),
            });

            // Try to parse response
            let responseData: Record<string, unknown> = {};
            try {
                responseData = await response.json();
            } catch {
                // Response might not be JSON
            }

            if (response.ok) {
                return {
                    success: true,
                    subscriberId: responseData.id as string || responseData.subscriber_id as string || 'unknown',
                    message: responseData.message as string || 'Successfully subscribed',
                };
            }

            // Handle errors
            const errorMessage = responseData.error as string
                || responseData.message as string
                || `Request failed with status ${response.status}`;

            // Check for duplicate indicators
            if (response.status === 409 ||
                errorMessage.toLowerCase().includes('already') ||
                errorMessage.toLowerCase().includes('duplicate') ||
                errorMessage.toLowerCase().includes('exists')) {
                return {
                    success: true,
                    alreadySubscribed: true,
                    message: 'Already subscribed',
                };
            }

            return {
                success: false,
                error: errorMessage,
                errorCode: String(response.status),
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Subscription failed',
            };
        }
    }

    /**
     * Custom providers don't have data to fetch
     */
    async fetchAllData(): Promise<ProviderData> {
        return {
            lists: [],
            forms: [],
            tags: [],
            campaigns: [],
        };
    }
}
