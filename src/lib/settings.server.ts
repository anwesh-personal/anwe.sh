/**
 * Server-side Settings Fetcher
 * Fetches settings for use in layout.tsx and other server components
 */

import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';

export interface SiteSettings {
    siteName?: string;
    siteTagline?: string;
    siteDescription?: string;
    siteLogo?: string;
    siteFavicon?: string;
    defaultMetaTitle?: string;
    defaultMetaDescription?: string;
    defaultOgImage?: string;
    socialTwitter?: string;
    socialLinkedin?: string;
    socialGithub?: string;
    socialYoutube?: string;
    googleAnalyticsId?: string;
    customHeadCode?: string;
    customBodyCode?: string;
}

// Cache the settings fetch for the request duration
export const getSettings = cache(async (): Promise<SiteSettings> => {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            console.error('Missing Supabase configuration for settings');
            return getDefaultSettings();
        }

        const supabase = createClient(supabaseUrl, serviceKey);

        const { data, error } = await supabase
            .from('site_settings')
            .select('key, value');

        if (error) {
            console.error('Error fetching settings:', error);
            return getDefaultSettings();
        }

        // Convert key-value array to object
        const settings: SiteSettings = {};
        (data || []).forEach((item: { key: string; value: unknown }) => {
            if (item.key && typeof item.key === 'string') {
                (settings as Record<string, unknown>)[item.key] = item.value;
            }
        });

        return { ...getDefaultSettings(), ...settings };

    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return getDefaultSettings();
    }
});

/**
 * Get a specific setting value
 */
export async function getSetting(key: keyof SiteSettings): Promise<unknown> {
    const settings = await getSettings();
    return settings[key];
}

/**
 * Default settings fallback
 */
function getDefaultSettings(): SiteSettings {
    return {
        siteName: 'Anwesh Rath',
        siteTagline: 'Systems Architect & Enterprise Builder',
        siteDescription: '17+ years architecting enterprise solutions, AI systems, and automation that transforms how businesses scale and dominate.',
        defaultMetaTitle: 'Anwesh Rath - Systems Architect & Enterprise Builder',
        defaultMetaDescription: '17+ years architecting enterprise solutions, AI systems, and automation that transforms how businesses scale.'
    };
}
