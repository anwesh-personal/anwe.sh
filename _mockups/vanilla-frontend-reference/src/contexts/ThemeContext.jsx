/**
 * Theme Context
 * Manages theme and brand kit selection
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { brandKits } from '../config/brandKits.js';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentBrandKit, setCurrentBrandKit] = useState('modern-minimal');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedBrandKit = localStorage.getItem('brandKit') || 'modern-minimal';
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    
    setCurrentBrandKit(savedBrandKit);
    setDarkMode(savedDarkMode);
    applyTheme(savedBrandKit, savedDarkMode);
  }, []);

  const applyTheme = (brandKitId, isDark) => {
    const brandKit = brandKits[brandKitId];
    if (!brandKit) return;

    const theme = isDark ? brandKit.dark : brandKit.light;
    const root = document.documentElement;

    // Apply colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply fonts
    root.style.setProperty('--font-primary', brandKit.fonts.primary);
    root.style.setProperty('--font-secondary', brandKit.fonts.secondary);
    root.style.setProperty('--font-mono', brandKit.fonts.mono);

    // Apply font weights
    root.style.setProperty('--font-weight-normal', brandKit.fontWeights.normal);
    root.style.setProperty('--font-weight-medium', brandKit.fontWeights.medium);
    root.style.setProperty('--font-weight-bold', brandKit.fontWeights.bold);

    // Apply spacing scale
    Object.entries(brandKit.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply border radius
    Object.entries(brandKit.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    // Apply shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Apply body class for dark mode
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Apply brand kit class
    document.body.className = document.body.className
      .replace(/brand-kit-\w+/g, '')
      .trim();
    document.body.classList.add(`brand-kit-${brandKitId}`);
  };

  const setBrandKit = (brandKitId) => {
    setCurrentBrandKit(brandKitId);
    localStorage.setItem('brandKit', brandKitId);
    applyTheme(brandKitId, darkMode);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    applyTheme(currentBrandKit, newDarkMode);
  };

  const currentTheme = darkMode 
    ? brandKits[currentBrandKit].dark 
    : brandKits[currentBrandKit].light;

  const value = {
    currentBrandKit,
    darkMode,
    brandKit: brandKits[currentBrandKit],
    theme: currentTheme,
    setBrandKit,
    toggleDarkMode,
    availableBrandKits: Object.keys(brandKits).map(key => ({
      id: key,
      name: brandKits[key].name,
      description: brandKits[key].description
    }))
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
