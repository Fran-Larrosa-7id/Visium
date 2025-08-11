module.exports = {
  darkMode: 'class', // Enable dark mode
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Medical theme colors
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Legacy colors for compatibility
        main: '#14b8a6',        // Teal medical color
        secondary: '#0d9488',   // Darker teal
        background: '#f8fafc',  // Light background
        text: '#1f2937',        // Dark text
        border: '#e5e7eb',      // Light border
        hover: '#0f766e',       // Hover teal
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Professional medical font
        mono: ['JetBrains Mono', 'Courier New', 'monospace'], // For medical data
      },
      boxShadow: {
        'medical': '0 8px 32px rgba(13, 148, 136, 0.12)',
        'medical-lg': '0 12px 40px rgba(13, 148, 136, 0.15)',
      },
    },
    screens: {
      xs: '480px',
      xsl: '510px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1300px',
      '2xl': '1536px',
    },
  },
  plugins: [],
}