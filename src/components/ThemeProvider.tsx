'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes, applyTheme, type ThemeName, type Theme } from '@/lib/themes';
import { getGlobalTheme, setGlobalTheme as saveGlobalTheme } from '@/lib/supabase';

interface ThemeContextType {
    currentTheme: ThemeName;
    theme: Theme;
    setTheme: (theme: ThemeName) => void;
    availableThemes: ThemeName[];
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<ThemeName>('emerald-night');
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch global theme from database
        const fetchGlobalTheme = async () => {
            try {
                const globalTheme = await getGlobalTheme();
                setCurrentTheme(globalTheme);
                applyTheme(globalTheme);
            } catch (error) {
                console.error('Failed to fetch global theme:', error);
                // Fall back to default
                applyTheme('emerald-night');
            } finally {
                setMounted(true);
                setIsLoading(false);
            }
        };

        fetchGlobalTheme();
    }, []);

    const handleSetTheme = async (themeName: ThemeName) => {
        setCurrentTheme(themeName);
        applyTheme(themeName);

        // Save to database (global for everyone)
        const result = await saveGlobalTheme(themeName);
        if (!result.success) {
            console.error('Failed to save global theme:', result.error);
        }
    };

    const contextValue = {
        currentTheme,
        theme: themes[currentTheme],
        setTheme: handleSetTheme,
        availableThemes: Object.keys(themes) as ThemeName[],
        isLoading
    };

    // Always provide context, but hide content until mounted to prevent theme flash
    return (
        <ThemeContext.Provider value={contextValue}>
            <div style={mounted ? undefined : { visibility: 'hidden' }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
