/**
 * Theme Switcher Component
 * Allows users to switch between brand kits and dark/light modes
 */

import React, { useState } from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';

const ThemeSwitcher = () => {
  const { darkMode, toggleDarkMode, currentBrandKit, setBrandKit, availableBrandKits } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[var(--color-background-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-background-tertiary)] transition-colors"
        style={{ fontFamily: 'var(--font-primary)' }}
      >
        <Palette className="w-4 h-4" />
        <span className="text-sm font-medium">Theme</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 w-80 rounded-lg border border-[var(--color-border)] shadow-xl z-50"
            style={{
              backgroundColor: 'var(--color-background)',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            {/* Dark Mode Toggle */}
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {darkMode ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                  <span className="font-medium" style={{ fontFamily: 'var(--font-primary)' }}>
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Brand Kit Selection */}
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-primary)' }}>
                Brand Kits
              </h3>
              <div className="space-y-2">
                {availableBrandKits.map((kit) => (
                  <button
                    key={kit.id}
                    onClick={() => {
                      setBrandKit(kit.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      currentBrandKit === kit.id
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-background-secondary)] hover:bg-[var(--color-background-tertiary)]'
                    }`}
                    style={{ fontFamily: 'var(--font-primary)' }}
                  >
                    <div className="font-medium">{kit.name}</div>
                    <div className={`text-xs mt-1 ${
                      currentBrandKit === kit.id ? 'text-white/80' : 'text-[var(--color-foreground-secondary)]'
                    }`}>
                      {kit.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
