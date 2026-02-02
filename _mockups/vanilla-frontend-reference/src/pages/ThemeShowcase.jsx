/**
 * Theme Showcase Page
 * Visual demonstration of all brand kits
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { Zap, Brain, User, Settings, ArrowRight } from 'lucide-react';

const ThemeShowcase = () => {
  const { theme, brandKit } = useTheme();

  return (
    <div 
      className="min-h-screen p-8"
      style={{ 
        backgroundColor: 'var(--color-background)',
        fontFamily: 'var(--font-primary)'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 
            className="text-5xl font-bold mb-4"
            style={{ 
              color: 'var(--color-foreground)',
              fontFamily: 'var(--font-primary)',
              fontWeight: 'var(--font-weight-bold)'
            }}
          >
            {brandKit.name}
          </h1>
          <p 
            className="text-xl"
            style={{ color: 'var(--color-foreground-secondary)' }}
          >
            {brandKit.description}
          </p>
        </div>

        {/* Color Palette */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-foreground)' }}>
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(theme.colors).map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--color-background-secondary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div
                  className="w-full h-20 rounded mb-2"
                  style={{ backgroundColor: value }}
                />
                <div className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  {key}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-foreground-secondary)' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-foreground)' }}>
            Typography
          </h2>
          <div 
            className="rounded-lg p-8"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)'
            }}
          >
            <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--color-foreground)' }}>
              Heading 1 - {brandKit.fonts.primary.split("'")[1]}
            </h1>
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-foreground)' }}>
              Heading 2 - Bold and Impactful
            </h2>
            <h3 className="text-3xl font-medium mb-4" style={{ color: 'var(--color-foreground)' }}>
              Heading 3 - Medium Weight
            </h3>
            <p className="text-lg mb-4" style={{ color: 'var(--color-foreground-secondary)' }}>
              Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <code 
              className="text-sm p-2 rounded"
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--color-background-tertiary)',
                color: 'var(--color-primary)'
              }}
            >
              Code: const example = "monospace font";
            </code>
          </div>
        </div>

        {/* Components Showcase */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-foreground)' }}>
            Components
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Card */}
            <div
              className="rounded-lg p-6"
              style={{
                backgroundColor: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Zap className="w-6 h-6" style={{ color: 'var(--color-background)' }} />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--color-foreground)' }}>
                    Token Wallet
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                    Manage your tokens
                  </p>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                1,000
              </div>
              <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                Available tokens
              </p>
            </div>

            {/* Buttons */}
            <div
              className="rounded-lg p-6"
              style={{
                backgroundColor: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <h3 className="font-bold mb-4" style={{ color: 'var(--color-foreground)' }}>
                Buttons
              </h3>
              <div className="space-y-3">
                <button
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-background)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  Primary Button
                </button>
                <button
                  className="w-full py-3 px-4 rounded-lg font-medium border transition-all"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)'
                  }}
                >
                  Outline Button
                </button>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'AI Studio', desc: 'Execute AI models' },
              { icon: User, title: 'Profile', desc: 'Manage account' },
              { icon: Settings, title: 'Settings', desc: 'Configure app' }
            ].map((item, index) => (
              <div
                key={index}
                className="rounded-lg p-6 cursor-pointer transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-background-secondary)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: 'var(--color-background)' }} />
                  </div>
                  <ArrowRight className="w-5 h-5" style={{ color: 'var(--color-foreground-secondary)' }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Shadows */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-foreground)' }}>
            Shadow System
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['sm', 'md', 'lg', 'xl'].map((size) => (
              <div
                key={size}
                className="rounded-lg p-6 text-center"
                style={{
                  backgroundColor: 'var(--color-background-secondary)',
                  boxShadow: `var(--shadow-${size})`
                }}
              >
                <div className="font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>
                  Shadow {size.toUpperCase()}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                  var(--shadow-{size})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeShowcase;
