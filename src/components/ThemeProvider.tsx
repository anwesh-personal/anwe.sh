'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes, applyTheme, getSavedTheme, type ThemeName, type Theme } from '@/lib/themes';

interface ThemeContextType {
    currentTheme: ThemeName;
    theme: Theme;
    setTheme: (theme: ThemeName) => void;
    availableThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<ThemeName>('emerald-night');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = getSavedTheme();
        setCurrentTheme(saved);
        applyTheme(saved);
        setMounted(true);
    }, []);

    const handleSetTheme = (themeName: ThemeName) => {
        setCurrentTheme(themeName);
        applyTheme(themeName);
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return (
            <div style={{ visibility: 'hidden' }}>
                {children}
            </div>
        );
    }

    return (
        <ThemeContext.Provider
            value={{
                currentTheme,
                theme: themes[currentTheme],
                setTheme: handleSetTheme,
                availableThemes: Object.keys(themes) as ThemeName[]
            }}
        >
            {children}
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
