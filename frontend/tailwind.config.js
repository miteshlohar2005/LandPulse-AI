/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0FAF4',
          100: '#DFF5E7', // Light Green
          200: '#B8EACD',
          300: '#8CD8AF',
          400: '#54BD8B',
          500: '#2EA16D',
          600: '#1F8455',
          700: '#186843',
          800: '#123D30', // Dark Background
          900: '#0F4D35', // Deep Forest Green (Primary)
          950: '#0A3323',
        },
        app: {
          bg: '#F7F8F4',  // App Background
          card: '#FFFFFF', // Cards
          muted: '#68736E',
          border: '#E3E7E1',
          subtle: '#EEF0EA'
        },
        risk: {
          low: '#2E7D32',      // Low Risk
          medium: '#F9A825',   // Medium Risk
          high: '#E53935',     // High Risk
          critical: '#C62828'  // Critical Risk
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'mobile': '0 10px 30px -5px rgba(15, 77, 53, 0.12), 0 4px 10px -2px rgba(15, 77, 53, 0.06)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'nav': '0 -4px 20px 0 rgba(0, 0, 0, 0.06)'
      }
    },
  },
  plugins: [],
}
