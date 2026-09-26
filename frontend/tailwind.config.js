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
        slate: {
          950: '#070C18',
          900: '#0B1326',
          850: '#111A30',
          800: '#171F33',
          750: '#1E2842',
          700: '#283452',
          600: '#3E4D73',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          100: '#F1F5F9',
        },
        brand: {
          50: '#F0F9FF',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          950: '#072740',
        },
        brics: {
          resilience: '#001F5B',
          innovation: '#006CD4',
          'innovation-cyan': '#00BCD4',
          cooperation: '#00897B',
          sustainability: '#2E7D32',
          india: '#F97316',
          china: '#EF4444',
          sa: '#EAB308',
          brazil: '#16A34A',
          russia: '#2563EB',
        },
        surface: {
          ground: '#F4F7FB',
          card: '#FFFFFF',
        },
        health: {
          success: '#2E7D32',
          warning: '#F59E0B',
          critical: '#DC2626',
          info: '#006CD4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-in-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2.5s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}
