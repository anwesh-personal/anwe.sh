/**
 * Brand Kit Visual Mockups
 * Interactive preview of all 5 brand kits in light/dark modes
 */

import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { Moon, Sun, Check } from 'lucide-react';

const BrandKitMockups = () => {
  const { brandKits, availableBrandKits, setBrandKit, toggleDarkMode, darkMode } = useTheme();
  const [selectedKit, setSelectedKit] = useState('modern-minimal');
  const [selectedMode, setSelectedMode] = useState('light');

  const currentKit = brandKits[selectedKit];
  const currentTheme = selectedMode === 'dark' ? currentKit.dark : currentKit.light;

  const applyMockupTheme = (kitId, mode) => {
    const kit = brandKits[kitId];
    const theme = mode === 'dark' ? kit.dark : kit.light;
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--mockup-color-${key}`, value);
    });

    root.style.setProperty('--mockup-font-primary', kit.fonts.primary);
    root.style.setProperty('--mockup-font-secondary', kit.fonts.secondary);
  };

  React.useEffect(() => {
    applyMockupTheme(selectedKit, selectedMode);
  }, [selectedKit, selectedMode]);

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: currentTheme.colors.background }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: currentTheme.colors.foreground, fontFamily: currentKit.fonts.primary }}>
            Brand Kit Visual Mockups
          </h1>
          <p className="text-lg" style={{ color: currentTheme.colors['foreground-secondary'] }}>
            Preview all 5 brand kits in light and dark modes
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 p-6 rounded-lg" style={{ backgroundColor: currentTheme.colors['background-secondary'], border: `1px solid ${currentTheme.colors.border}` }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Brand Kit Selector */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.foreground }}>
                Select Brand Kit
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableBrandKits.map((kit) => (
                  <button
                    key={kit.id}
                    onClick={() => setSelectedKit(kit.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedKit === kit.id ? 'border-2' : 'border'
                    }`}
                    style={{
                      backgroundColor: selectedKit === kit.id ? currentTheme.colors.primary : currentTheme.colors.background,
                      color: selectedKit === kit.id ? '#ffffff' : currentTheme.colors.foreground,
                      borderColor: selectedKit === kit.id ? currentTheme.colors.primary : currentTheme.colors.border
                    }}
                  >
                    <div className="font-semibold">{kit.name}</div>
                    <div className="text-xs opacity-75">{kit.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Toggle */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.foreground }}>
                Color Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMode('light')}
                  className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                    selectedMode === 'light' ? 'border-2' : 'border'
                  }`}
                  style={{
                    backgroundColor: selectedMode === 'light' ? currentTheme.colors.primary : currentTheme.colors.background,
                    color: selectedMode === 'light' ? '#ffffff' : currentTheme.colors.foreground,
                    borderColor: selectedMode === 'light' ? currentTheme.colors.primary : currentTheme.colors.border
                  }}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setSelectedMode('dark')}
                  className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                    selectedMode === 'dark' ? 'border-2' : 'border'
                  }`}
                  style={{
                    backgroundColor: selectedMode === 'dark' ? currentTheme.colors.primary : currentTheme.colors.background,
                    color: selectedMode === 'dark' ? '#ffffff' : currentTheme.colors.foreground,
                    borderColor: selectedMode === 'dark' ? currentTheme.colors.primary : currentTheme.colors.border
                  }}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mockup Preview */}
        <div className="space-y-8">
          {/* Dashboard Mockup */}
          <div className="rounded-lg overflow-hidden shadow-xl" style={{ backgroundColor: currentTheme.colors.background, border: `1px solid ${currentTheme.colors.border}` }}>
            <div className="p-6 border-b" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors['background-secondary'] }}>
              <h2 className="text-2xl font-bold" style={{ color: currentTheme.colors.foreground, fontFamily: currentKit.fonts.primary }}>
                Dashboard Preview
              </h2>
            </div>
            <div className="p-6">
              {/* Header Bar */}
              <div className="flex justify-between items-center mb-6 p-4 rounded-lg" style={{ backgroundColor: currentTheme.colors['background-secondary'] }}>
                <div className="font-bold text-xl" style={{ color: currentTheme.colors.foreground, fontFamily: currentKit.fonts.primary }}>
                  SaaS Platform
                </div>
                <div className="flex gap-2">
                  <div className="px-4 py-2 rounded" style={{ backgroundColor: currentTheme.colors.primary, color: '#ffffff' }}>
                    Dashboard
                  </div>
                  <div className="px-4 py-2 rounded" style={{ backgroundColor: currentTheme.colors['background-tertiary'], color: currentTheme.colors.foreground }}>
                    Profile
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Users', value: '12,345', color: currentTheme.colors.primary },
                  { label: 'Active Sessions', value: '8,901', color: currentTheme.colors.secondary },
                  { label: 'Revenue', value: '$45,678', color: currentTheme.colors.accent },
                  { label: 'Growth', value: '+23%', color: currentTheme.colors.success }
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-lg"
                    style={{ backgroundColor: currentTheme.colors['background-secondary'], border: `1px solid ${currentTheme.colors.border}` }}
                  >
                    <div className="text-sm mb-2" style={{ color: currentTheme.colors['foreground-secondary'] }}>
                      {stat.label}
                    </div>
                    <div className="text-3xl font-bold" style={{ color: stat.color, fontFamily: currentKit.fonts.primary }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Create New', icon: '➕', color: currentTheme.colors.primary },
                  { label: 'View Analytics', icon: '📊', color: currentTheme.colors.secondary },
                  { label: 'Settings', icon: '⚙️', color: currentTheme.colors.accent }
                ].map((action, idx) => (
                  <button
                    key={idx}
                    className="p-6 rounded-lg text-left transition-transform hover:scale-105"
                    style={{ backgroundColor: currentTheme.colors['background-secondary'], border: `2px solid ${action.color}` }}
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <div className="font-semibold" style={{ color: currentTheme.colors.foreground, fontFamily: currentKit.fonts.primary }}>
                      {action.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Component Showcase */}
          <div className="rounded-lg overflow-hidden shadow-xl" style={{ backgroundColor: currentTheme.colors.background, border: `1px solid ${currentTheme.colors.border}` }}>
            <div className="p-6 border-b" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors['background-secondary'] }}>
              <h2 className="text-2xl font-bold" style={{ color: currentTheme.colors.foreground, fontFamily: currentKit.fonts.primary }}>
                Component Showcase
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Buttons */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: currentTheme.colors.foreground }}>
                    Buttons
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: currentTheme.colors.primary, color: '#ffffff' }}>
                      Primary Button
                    </button>
                    <button className="w-full px-4 py-2 rounded-lg font-medium border-2" style={{ borderColor: currentTheme.colors.primary, color: currentTheme.colors.primary }}>
                      Secondary Button
                    </button>
                    <button className="w-full px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: currentTheme.colors.success, color: '#ffffff' }}>
                      Success Button
                    </button>
                    <button className="w-full px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: currentTheme.colors.error, color: '#ffffff' }}>
                      Error Button
                    </button>
                  </div>
                </div>

                {/* Cards */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: currentTheme.colors.foreground }}>
                    Cards
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: currentTheme.colors['background-secondary'], border: `1px solid ${currentTheme.colors.border}` }}>
                      <div className="font-semibold mb-2" style={{ color: currentTheme.colors.foreground }}>
                        Card Title
                      </div>
                      <div className="text-sm" style={{ color: currentTheme.colors['foreground-secondary'] }}>
                        This is a sample card component with the current theme applied.
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border-2" style={{ borderColor: currentTheme.colors.primary }}>
                      <div className="font-semibold mb-2" style={{ color: currentTheme.colors.primary }}>
                        Highlighted Card
                      </div>
                      <div className="text-sm" style={{ color: currentTheme.colors['foreground-secondary'] }}>
                        This card has a primary border for emphasis.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: currentTheme.colors.foreground }}>
                    Typography
                  </h3>
                  <div className="space-y-2" style={{ fontFamily: currentKit.fonts.primary }}>
                    <h1 className="text-4xl font-bold" style={{ color: currentTheme.colors.foreground }}>Heading 1</h1>
                    <h2 className="text-3xl font-bold" style={{ color: currentTheme.colors.foreground }}>Heading 2</h2>
                    <h3 className="text-2xl font-semibold" style={{ color: currentTheme.colors.foreground }}>Heading 3</h3>
                    <p className="text-base" style={{ color: currentTheme.colors.foreground }}>Regular paragraph text</p>
                    <p className="text-sm" style={{ color: currentTheme.colors['foreground-secondary'] }}>Secondary text color</p>
                  </div>
                </div>

                {/* Form Elements */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: currentTheme.colors.foreground }}>
                    Form Elements
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Text input"
                      className="w-full px-4 py-2 rounded-lg"
                      style={{ backgroundColor: currentTheme.colors.background, border: `1px solid ${currentTheme.colors.border}`, color: currentTheme.colors.foreground }}
                    />
                    <select
                      className="w-full px-4 py-2 rounded-lg"
                      style={{ backgroundColor: currentTheme.colors.background, border: `1px solid ${currentTheme.colors.border}`, color: currentTheme.colors.foreground }}
                    >
                      <option>Select option</option>
                      <option>Option 1</option>
                      <option>Option 2</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" style={{ accentColor: currentTheme.colors.primary }} />
                      <label style={{ color: currentTheme.colors.foreground }}>Checkbox option</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="rounded-lg overflow-hidden shadow-xl" style={{ backgroundColor: currentTheme.colors.background, border: `1px solid ${currentTheme.colors.border}` }}>
            <div className="p-6 border-b" style={{ borderColor: currentTheme.colors.border, backgroundColor: currentTheme.colors['background-secondary'] }}>
              <h2 className="text-2xl font-bold" style={{ color: currentTheme.colors.foreground, fontFamily: currentKit.fonts.primary }}>
                Color Palette
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(currentTheme.colors).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div
                      className="w-full h-24 rounded-lg mb-2 border"
                      style={{ backgroundColor: value, borderColor: currentTheme.colors.border }}
                    />
                    <div className="text-xs font-mono mb-1" style={{ color: currentTheme.colors.foreground }}>
                      {key}
                    </div>
                    <div className="text-xs font-mono" style={{ color: currentTheme.colors['foreground-secondary'] }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setBrandKit(selectedKit);
              if (selectedMode === 'dark' && !darkMode) toggleDarkMode();
              if (selectedMode === 'light' && darkMode) toggleDarkMode();
            }}
            className="px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 mx-auto"
            style={{ backgroundColor: currentTheme.colors.primary, color: '#ffffff' }}
          >
            <Check className="w-5 h-5" />
            Apply This Brand Kit
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandKitMockups;
