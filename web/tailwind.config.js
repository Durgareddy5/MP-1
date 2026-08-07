/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0052FF', // Primary Electric Blue
          600: '#0047e1',
          700: '#003bb8',
          800: '#002e8a',
          900: '#00215c',
          950: '#001433',
        },

        // Dark Theme Surface Colors
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          850: '#1e1e22',
          900: '#18181b',
          925: '#131316',
          950: '#09090b',
        },

        // Trading specific
        profit: {
          DEFAULT: '#00D26A',
          light: '#00E676',
          dark: '#00A854',
          bg: 'rgba(0, 210, 106, 0.08)',
          'bg-hover': 'rgba(0, 210, 106, 0.15)',
        },
        loss: {
          DEFAULT: '#FF3B30',
          light: '#FF6B6B',
          dark: '#CC2F26',
          bg: 'rgba(255, 59, 48, 0.08)',
          'bg-hover': 'rgba(255, 59, 48, 0.15)',
        },
        warning: {
          DEFAULT: '#FFB800',
          bg: 'rgba(255, 184, 0, 0.08)',
        },

        // Glass
        glass: {
          light: 'rgba(255, 255, 255, 0.05)',
          medium: 'rgba(255, 255, 255, 0.08)',
          heavy: 'rgba(255, 255, 255, 0.12)',
          border: 'rgba(255, 255, 255, 0.06)',
          'border-light': 'rgba(255, 255, 255, 0.1)',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'ticker': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        'data': ['0.8125rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'data-lg': ['0.9375rem', { lineHeight: '1.375rem', fontWeight: '600' }],
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.02)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
        'dot-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        'hero-gradient': 'linear-gradient(135deg, #0052FF 0%, #00D26A 50%, #FFB800 100%)',
        'mesh-gradient': 'linear-gradient(135deg, rgba(0,82,255,0.15) 0%, rgba(0,210,106,0.08) 50%, rgba(255,184,0,0.05) 100%)',
      },

      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 2px 8px rgba(0, 0, 0, 0.2)',
        'glass-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        'glow-blue': '0 0 30px rgba(0, 82, 255, 0.3)',
        'glow-green': '0 0 30px rgba(0, 210, 106, 0.3)',
        'glow-red': '0 0 30px rgba(255, 59, 48, 0.3)',
        'card': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'card-hover': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
        'neon-blue': '0 0 5px theme(colors.brand.500), 0 0 20px theme(colors.brand.500)',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'ticker': 'ticker 30s linear infinite',
        'border-flow': 'borderFlow 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,82,255,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0,82,255,0.6)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        borderFlow: {
          '0%, 100%': { borderColor: 'rgba(0,82,255,0.3)' },
          '50%': { borderColor: 'rgba(0,82,255,0.8)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },

      backdropBlur: {
        xs: '2px',
      },

      borderRadius: {
        '4xl': '2rem',
      },

      transitionDuration: {
        '400': '400ms',
      },

      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
};