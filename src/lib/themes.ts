/**
 * ANWE.SH Theme System
 * 5 Premium Themes for the Admin Panel & Site-wide use
 * Each theme has a distinct personality while maintaining usability
 */

export type ThemeMode = 'dark' | 'light';
export type ThemeName = 'emerald-night' | 'ocean-deep' | 'sunset-ember' | 'arctic-frost' | 'golden-hour';

export interface ThemeColors {
    // Core backgrounds
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;

    // Surface colors (cards, modals)
    surface: string;
    surfaceHover: string;

    // Text
    foreground: string;
    foregroundSecondary: string;
    foregroundMuted: string;

    // Accent gradient
    accentStart: string;
    accentEnd: string;
    accentSolid: string;

    // Interactive
    border: string;
    borderHover: string;

    // Status
    success: string;
    warning: string;
    error: string;
    info: string;

    // Glow effects
    glowPrimary: string;
    glowSecondary: string;
}

export interface Theme {
    id: ThemeName;
    name: string;
    description: string;
    mode: ThemeMode;
    fonts: {
        primary: string;
        secondary: string;
        mono: string;
    };
    colors: ThemeColors;
    shadows: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        glow: string;
    };
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        full: string;
    };
}

export const themes: Record<ThemeName, Theme> = {
    /**
     * EMERALD NIGHT (Default)
     * The signature ANWE.SH theme - dark, sophisticated, tech-forward
     * Emerald/teal gradient accents on deep black
     */
    'emerald-night': {
        id: 'emerald-night',
        name: 'Emerald Night',
        description: 'Dark & sophisticated with emerald accents',
        mode: 'dark',
        fonts: {
            primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            secondary: "'Space Grotesk', -apple-system, sans-serif",
            mono: "'JetBrains Mono', 'Fira Code', monospace"
        },
        colors: {
            background: '#0a0a0a',
            backgroundSecondary: '#111111',
            backgroundTertiary: '#1a1a1a',

            surface: '#111111',
            surfaceHover: '#1a1a1a',

            foreground: '#ffffff',
            foregroundSecondary: '#a8a8a8',
            foregroundMuted: '#666666',

            accentStart: '#11998E',
            accentEnd: '#38EF7D',
            accentSolid: '#22c997',

            border: 'rgba(255, 255, 255, 0.1)',
            borderHover: 'rgba(17, 153, 142, 0.5)',

            success: '#38EF7D',
            warning: '#fbbf24',
            error: '#ef4444',
            info: '#11998E',

            glowPrimary: 'rgba(17, 153, 142, 0.4)',
            glowSecondary: 'rgba(56, 239, 125, 0.3)'
        },
        shadows: {
            sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
            md: '0 4px 6px rgba(0, 0, 0, 0.6)',
            lg: '0 10px 15px rgba(0, 0, 0, 0.7)',
            xl: '0 20px 25px rgba(0, 0, 0, 0.8)',
            glow: '0 0 20px rgba(17, 153, 142, 0.4), 0 0 40px rgba(56, 239, 125, 0.2)'
        },
        borderRadius: {
            sm: '0.375rem',
            md: '0.5rem',
            lg: '0.75rem',
            xl: '1rem',
            full: '9999px'
        }
    },

    /**
     * OCEAN DEEP
     * Deep blue, professional, enterprise-grade
     * Purple-blue gradient for a corporate yet modern feel
     */
    'ocean-deep': {
        id: 'ocean-deep',
        name: 'Ocean Deep',
        description: 'Deep blue with purple accents',
        mode: 'dark',
        fonts: {
            primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            secondary: "'Space Grotesk', -apple-system, sans-serif",
            mono: "'JetBrains Mono', 'Fira Code', monospace"
        },
        colors: {
            background: '#0a1628',
            backgroundSecondary: '#0f1f35',
            backgroundTertiary: '#152744',

            surface: '#0f1f35',
            surfaceHover: '#152744',

            foreground: '#f0f4f8',
            foregroundSecondary: '#94a3b8',
            foregroundMuted: '#64748b',

            accentStart: '#667eea',
            accentEnd: '#764ba2',
            accentSolid: '#7c6bea',

            border: 'rgba(255, 255, 255, 0.08)',
            borderHover: 'rgba(102, 126, 234, 0.5)',

            success: '#34d399',
            warning: '#fbbf24',
            error: '#f87171',
            info: '#667eea',

            glowPrimary: 'rgba(102, 126, 234, 0.4)',
            glowSecondary: 'rgba(118, 75, 162, 0.3)'
        },
        shadows: {
            sm: '0 1px 2px rgba(0, 10, 30, 0.5)',
            md: '0 4px 6px rgba(0, 10, 30, 0.6)',
            lg: '0 10px 15px rgba(0, 10, 30, 0.7)',
            xl: '0 20px 25px rgba(0, 10, 30, 0.8)',
            glow: '0 0 20px rgba(102, 126, 234, 0.4), 0 0 40px rgba(118, 75, 162, 0.2)'
        },
        borderRadius: {
            sm: '0.375rem',
            md: '0.5rem',
            lg: '0.75rem',
            xl: '1rem',
            full: '9999px'
        }
    },

    /**
     * SUNSET EMBER
     * Warm, creative, bold
     * Pink-red gradient for a passionate, energetic feel
     */
    'sunset-ember': {
        id: 'sunset-ember',
        name: 'Sunset Ember',
        description: 'Warm tones with pink-red accents',
        mode: 'dark',
        fonts: {
            primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            secondary: "'Poppins', -apple-system, sans-serif",
            mono: "'JetBrains Mono', 'Fira Code', monospace"
        },
        colors: {
            background: '#1a0a0a',
            backgroundSecondary: '#251111',
            backgroundTertiary: '#301818',

            surface: '#251111',
            surfaceHover: '#301818',

            foreground: '#fff5f5',
            foregroundSecondary: '#e8b4b4',
            foregroundMuted: '#a87878',

            accentStart: '#f093fb',
            accentEnd: '#f5576c',
            accentSolid: '#f576a3',

            border: 'rgba(255, 200, 200, 0.1)',
            borderHover: 'rgba(240, 147, 251, 0.5)',

            success: '#4ade80',
            warning: '#fbbf24',
            error: '#f5576c',
            info: '#f093fb',

            glowPrimary: 'rgba(240, 147, 251, 0.4)',
            glowSecondary: 'rgba(245, 87, 108, 0.3)'
        },
        shadows: {
            sm: '0 1px 2px rgba(30, 0, 0, 0.5)',
            md: '0 4px 6px rgba(30, 0, 0, 0.6)',
            lg: '0 10px 15px rgba(30, 0, 0, 0.7)',
            xl: '0 20px 25px rgba(30, 0, 0, 0.8)',
            glow: '0 0 20px rgba(240, 147, 251, 0.4), 0 0 40px rgba(245, 87, 108, 0.2)'
        },
        borderRadius: {
            sm: '0.5rem',
            md: '0.625rem',
            lg: '0.875rem',
            xl: '1.25rem',
            full: '9999px'
        }
    },

    /**
     * ARCTIC FROST
     * Cool, minimal, clean
     * Soft pastel gradient for a calm, focused experience
     */
    'arctic-frost': {
        id: 'arctic-frost',
        name: 'Arctic Frost',
        description: 'Cool & minimal with soft pastels',
        mode: 'dark',
        fonts: {
            primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            secondary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            mono: "'JetBrains Mono', 'Fira Code', monospace"
        },
        colors: {
            background: '#0f0f14',
            backgroundSecondary: '#16161d',
            backgroundTertiary: '#1d1d26',

            surface: '#16161d',
            surfaceHover: '#1d1d26',

            foreground: '#f8fafc',
            foregroundSecondary: '#c4ccd4',
            foregroundMuted: '#7a8490',

            accentStart: '#a8edea',
            accentEnd: '#fed6e3',
            accentSolid: '#c8e2e4',

            border: 'rgba(200, 220, 255, 0.08)',
            borderHover: 'rgba(168, 237, 234, 0.4)',

            success: '#6ee7b7',
            warning: '#fcd34d',
            error: '#fca5a5',
            info: '#a8edea',

            glowPrimary: 'rgba(168, 237, 234, 0.35)',
            glowSecondary: 'rgba(254, 214, 227, 0.25)'
        },
        shadows: {
            sm: '0 1px 2px rgba(0, 5, 15, 0.4)',
            md: '0 4px 6px rgba(0, 5, 15, 0.5)',
            lg: '0 10px 15px rgba(0, 5, 15, 0.6)',
            xl: '0 20px 25px rgba(0, 5, 15, 0.7)',
            glow: '0 0 20px rgba(168, 237, 234, 0.3), 0 0 40px rgba(254, 214, 227, 0.15)'
        },
        borderRadius: {
            sm: '0.25rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
            full: '9999px'
        }
    },

    /**
     * GOLDEN HOUR
     * Luxury, premium, warm glow
     * Gold-orange gradient for a rich, refined aesthetic
     */
    'golden-hour': {
        id: 'golden-hour',
        name: 'Golden Hour',
        description: 'Luxury gold with warm tones',
        mode: 'dark',
        fonts: {
            primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            secondary: "'Playfair Display', Georgia, serif",
            mono: "'JetBrains Mono', 'Fira Code', monospace"
        },
        colors: {
            background: '#0d0d08',
            backgroundSecondary: '#1a1a12',
            backgroundTertiary: '#25251a',

            surface: '#1a1a12',
            surfaceHover: '#25251a',

            foreground: '#faf5eb',
            foregroundSecondary: '#c9c0a8',
            foregroundMuted: '#8a8270',

            accentStart: '#f7971e',
            accentEnd: '#ffd200',
            accentSolid: '#f9b60f',

            border: 'rgba(255, 220, 150, 0.1)',
            borderHover: 'rgba(247, 151, 30, 0.5)',

            success: '#84cc16',
            warning: '#ffd200',
            error: '#ef4444',
            info: '#f7971e',

            glowPrimary: 'rgba(247, 151, 30, 0.4)',
            glowSecondary: 'rgba(255, 210, 0, 0.3)'
        },
        shadows: {
            sm: '0 1px 2px rgba(15, 10, 0, 0.5)',
            md: '0 4px 6px rgba(15, 10, 0, 0.6)',
            lg: '0 10px 15px rgba(15, 10, 0, 0.7)',
            xl: '0 20px 25px rgba(15, 10, 0, 0.8)',
            glow: '0 0 20px rgba(247, 151, 30, 0.4), 0 0 40px rgba(255, 210, 0, 0.2)'
        },
        borderRadius: {
            sm: '0.375rem',
            md: '0.5rem',
            lg: '0.75rem',
            xl: '1rem',
            full: '9999px'
        }
    }
};

/**
 * Get theme CSS variables
 */
export function getThemeCSSVariables(theme: Theme): Record<string, string> {
    return {
        '--color-background': theme.colors.background,
        '--color-background-secondary': theme.colors.backgroundSecondary,
        '--color-background-tertiary': theme.colors.backgroundTertiary,

        '--color-surface': theme.colors.surface,
        '--color-surface-hover': theme.colors.surfaceHover,

        '--color-foreground': theme.colors.foreground,
        '--color-foreground-secondary': theme.colors.foregroundSecondary,
        '--color-foreground-muted': theme.colors.foregroundMuted,

        '--color-accent-start': theme.colors.accentStart,
        '--color-accent-end': theme.colors.accentEnd,
        '--color-accent-solid': theme.colors.accentSolid,
        '--color-accent-gradient': `linear-gradient(135deg, ${theme.colors.accentStart}, ${theme.colors.accentEnd})`,

        '--color-border': theme.colors.border,
        '--color-border-hover': theme.colors.borderHover,

        '--color-success': theme.colors.success,
        '--color-warning': theme.colors.warning,
        '--color-error': theme.colors.error,
        '--color-info': theme.colors.info,

        '--color-glow-primary': theme.colors.glowPrimary,
        '--color-glow-secondary': theme.colors.glowSecondary,

        '--font-primary': theme.fonts.primary,
        '--font-secondary': theme.fonts.secondary,
        '--font-mono': theme.fonts.mono,

        '--shadow-sm': theme.shadows.sm,
        '--shadow-md': theme.shadows.md,
        '--shadow-lg': theme.shadows.lg,
        '--shadow-xl': theme.shadows.xl,
        '--shadow-glow': theme.shadows.glow,

        '--radius-sm': theme.borderRadius.sm,
        '--radius-md': theme.borderRadius.md,
        '--radius-lg': theme.borderRadius.lg,
        '--radius-xl': theme.borderRadius.xl,
        '--radius-full': theme.borderRadius.full
    };
}

/**
 * Apply theme to document
 */
export function applyTheme(themeName: ThemeName): void {
    const theme = themes[themeName];
    if (!theme) return;

    const variables = getThemeCSSVariables(theme);
    const root = document.documentElement;

    Object.entries(variables).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });

    // Store preference
    localStorage.setItem('anwe-theme', themeName);

    // Update data attribute for potential CSS selectors
    document.body.dataset.theme = themeName;
}

/**
 * Get saved theme or default
 */
export function getSavedTheme(): ThemeName {
    if (typeof window === 'undefined') return 'emerald-night';

    const saved = localStorage.getItem('anwe-theme') as ThemeName;
    return saved && themes[saved] ? saved : 'emerald-night';
}

export default themes;
