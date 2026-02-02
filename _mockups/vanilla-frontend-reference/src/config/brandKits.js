/**
 * Brand Kits Configuration
 * 5 distinct brand kits with light/dark themes and fonts
 */

export const brandKits = {
  'modern-minimal': {
    name: 'Modern Minimal',
    description: 'Clean, professional, and minimalist design',
    fonts: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      secondary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace"
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      bold: '700'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px'
    },
    light: {
      colors: {
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        'primary-light': '#818cf8',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#ffffff',
        'background-secondary': '#f9fafb',
        'background-tertiary': '#f3f4f6',
        foreground: '#111827',
        'foreground-secondary': '#6b7280',
        border: '#e5e7eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }
    },
    dark: {
      colors: {
        primary: '#818cf8',
        'primary-dark': '#6366f1',
        'primary-light': '#a5b4fc',
        secondary: '#a78bfa',
        accent: '#f472b6',
        background: '#0f172a',
        'background-secondary': '#1e293b',
        'background-tertiary': '#334155',
        foreground: '#f1f5f9',
        'foreground-secondary': '#cbd5e1',
        border: '#334155',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)'
      }
    }
  },

  'tech-bold': {
    name: 'Tech Bold',
    description: 'Bold, modern tech startup aesthetic',
    fonts: {
      primary: "'Space Grotesk', -apple-system, sans-serif",
      secondary: "'Space Grotesk', -apple-system, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace"
    },
    fontWeights: {
      normal: '400',
      medium: '600',
      bold: '700'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem',
      xl: '1.5rem',
      full: '9999px'
    },
    light: {
      colors: {
        primary: '#000000',
        'primary-dark': '#000000',
        'primary-light': '#1a1a1a',
        secondary: '#00d4ff',
        accent: '#ff006e',
        background: '#ffffff',
        'background-secondary': '#fafafa',
        'background-tertiary': '#f5f5f5',
        foreground: '#000000',
        'foreground-secondary': '#666666',
        border: '#e0e0e0',
        success: '#00ff88',
        warning: '#ffbe0b',
        error: '#ff006e',
        info: '#00d4ff'
      },
      shadows: {
        sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
        md: '0 4px 8px rgba(0, 0, 0, 0.15)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
        xl: '0 16px 32px rgba(0, 0, 0, 0.25)'
      }
    },
    dark: {
      colors: {
        primary: '#00d4ff',
        'primary-dark': '#00a8cc',
        'primary-light': '#33ddff',
        secondary: '#ff006e',
        accent: '#00ff88',
        background: '#000000',
        'background-secondary': '#0a0a0a',
        'background-tertiary': '#1a1a1a',
        foreground: '#ffffff',
        'foreground-secondary': '#b3b3b3',
        border: '#333333',
        success: '#00ff88',
        warning: '#ffbe0b',
        error: '#ff006e',
        info: '#00d4ff'
      },
      shadows: {
        sm: '0 2px 4px rgba(0, 212, 255, 0.2)',
        md: '0 4px 8px rgba(0, 212, 255, 0.3)',
        lg: '0 8px 16px rgba(0, 212, 255, 0.4)',
        xl: '0 16px 32px rgba(0, 212, 255, 0.5)'
      }
    }
  },

  'elegant-classic': {
    name: 'Elegant Classic',
    description: 'Sophisticated and premium design',
    fonts: {
      primary: "'Playfair Display', Georgia, serif",
      secondary: "'Inter', -apple-system, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace"
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      bold: '700'
    },
    spacing: {
      xs: '0.375rem',
      sm: '0.75rem',
      md: '1.25rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4.5rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px'
    },
    light: {
      colors: {
        primary: '#1a1a1a',
        'primary-dark': '#000000',
        'primary-light': '#4a4a4a',
        secondary: '#d4af37',
        accent: '#8b4513',
        background: '#faf8f3',
        'background-secondary': '#f5f3ed',
        'background-tertiary': '#ede8dc',
        foreground: '#1a1a1a',
        'foreground-secondary': '#6b6b6b',
        border: '#d4d4d4',
        success: '#2d5016',
        warning: '#b8860b',
        error: '#8b0000',
        info: '#1e3a5f'
      },
      shadows: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 20px rgba(0, 0, 0, 0.12)',
        xl: '0 20px 40px rgba(0, 0, 0, 0.15)'
      }
    },
    dark: {
      colors: {
        primary: '#f5f3ed',
        'primary-dark': '#ede8dc',
        'primary-light': '#ffffff',
        secondary: '#d4af37',
        accent: '#c9a961',
        background: '#1a1a1a',
        'background-secondary': '#2a2a2a',
        'background-tertiary': '#3a3a3a',
        foreground: '#f5f3ed',
        'foreground-secondary': '#b8b8b8',
        border: '#4a4a4a',
        success: '#7cb342',
        warning: '#ffb300',
        error: '#d32f2f',
        info: '#42a5f5'
      },
      shadows: {
        sm: '0 1px 3px rgba(212, 175, 55, 0.2)',
        md: '0 4px 6px rgba(212, 175, 55, 0.25)',
        lg: '0 10px 20px rgba(212, 175, 55, 0.3)',
        xl: '0 20px 40px rgba(212, 175, 55, 0.35)'
      }
    }
  },

  'creative-playful': {
    name: 'Creative Playful',
    description: 'Vibrant, fun, and energetic design',
    fonts: {
      primary: "'Poppins', -apple-system, sans-serif",
      secondary: "'Poppins', -apple-system, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace"
    },
    fontWeights: {
      normal: '400',
      medium: '600',
      bold: '700'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2.5rem',
      '2xl': '4rem'
    },
    borderRadius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      full: '9999px'
    },
    light: {
      colors: {
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        'primary-light': '#818cf8',
        secondary: '#ec4899',
        accent: '#f59e0b',
        background: '#ffffff',
        'background-secondary': '#fef3c7',
        'background-tertiary': '#fde68a',
        foreground: '#1f2937',
        'foreground-secondary': '#6b7280',
        border: '#fbbf24',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      shadows: {
        sm: '0 2px 4px rgba(236, 72, 153, 0.1)',
        md: '0 4px 8px rgba(236, 72, 153, 0.15)',
        lg: '0 8px 16px rgba(236, 72, 153, 0.2)',
        xl: '0 16px 32px rgba(236, 72, 153, 0.25)'
      }
    },
    dark: {
      colors: {
        primary: '#a78bfa',
        'primary-dark': '#8b5cf6',
        'primary-light': '#c4b5fd',
        secondary: '#f472b6',
        accent: '#fbbf24',
        background: '#1e1b4b',
        'background-secondary': '#312e81',
        'background-tertiary': '#4338ca',
        foreground: '#f3f4f6',
        'foreground-secondary': '#d1d5db',
        border: '#6366f1',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa'
      },
      shadows: {
        sm: '0 2px 4px rgba(167, 139, 250, 0.3)',
        md: '0 4px 8px rgba(167, 139, 250, 0.4)',
        lg: '0 8px 16px rgba(167, 139, 250, 0.5)',
        xl: '0 16px 32px rgba(167, 139, 250, 0.6)'
      }
    }
  },

  'corporate-professional': {
    name: 'Corporate Professional',
    description: 'Enterprise-grade, trustworthy design',
    fonts: {
      primary: "'Roboto', -apple-system, sans-serif",
      secondary: "'Roboto', -apple-system, sans-serif",
      mono: "'Roboto Mono', 'Courier New', monospace"
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      bold: '700'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    light: {
      colors: {
        primary: '#1e40af',
        'primary-dark': '#1e3a8a',
        'primary-light': '#3b82f6',
        secondary: '#0f766e',
        accent: '#059669',
        background: '#ffffff',
        'background-secondary': '#f8fafc',
        'background-tertiary': '#f1f5f9',
        foreground: '#0f172a',
        'foreground-secondary': '#475569',
        border: '#cbd5e1',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#0284c7'
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.12)'
      }
    },
    dark: {
      colors: {
        primary: '#60a5fa',
        'primary-dark': '#3b82f6',
        'primary-light': '#93c5fd',
        secondary: '#2dd4bf',
        accent: '#10b981',
        background: '#0f172a',
        'background-secondary': '#1e293b',
        'background-tertiary': '#334155',
        foreground: '#f1f5f9',
        'foreground-secondary': '#cbd5e1',
        border: '#475569',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#f87171',
        info: '#38bdf8'
      },
      shadows: {
        sm: '0 1px 2px rgba(96, 165, 250, 0.2)',
        md: '0 4px 6px rgba(96, 165, 250, 0.25)',
        lg: '0 10px 15px rgba(96, 165, 250, 0.3)',
        xl: '0 20px 25px rgba(96, 165, 250, 0.35)'
      }
    }
  }
};
