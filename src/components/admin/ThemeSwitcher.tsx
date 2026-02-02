'use client';

import { useTheme } from '@/components/ThemeProvider';
import { themes } from '@/lib/themes';

export function ThemeSwitcher() {
    const { currentTheme, setTheme, availableThemes } = useTheme();

    return (
        <div className="theme-switcher">
            <span className="theme-switcher-label">Theme</span>
            <div className="theme-options">
                {availableThemes.map((themeName) => {
                    const theme = themes[themeName];
                    return (
                        <button
                            key={themeName}
                            className={`theme-option ${currentTheme === themeName ? 'active' : ''}`}
                            onClick={() => setTheme(themeName)}
                            title={theme.name}
                            style={{
                                '--preview-bg': theme.colors.background,
                                '--preview-accent-start': theme.colors.accentStart,
                                '--preview-accent-end': theme.colors.accentEnd,
                            } as React.CSSProperties}
                        >
                            <span className="theme-preview">
                                <span className="theme-preview-bg"></span>
                                <span className="theme-preview-accent"></span>
                            </span>
                            <span className="theme-name">{theme.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function ThemeSwitcherCompact() {
    const { currentTheme, setTheme, availableThemes } = useTheme();

    const handleNext = () => {
        const currentIndex = availableThemes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % availableThemes.length;
        setTheme(availableThemes[nextIndex]);
    };

    return (
        <button
            className="theme-switcher-compact"
            onClick={handleNext}
            title={`Current: ${themes[currentTheme].name}. Click to change.`}
        >
            <span
                className="theme-dot"
                style={{
                    background: `linear-gradient(135deg, ${themes[currentTheme].colors.accentStart}, ${themes[currentTheme].colors.accentEnd})`
                }}
            ></span>
        </button>
    );
}
