import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — neutral professional with teal accent
        brand: {
          50: '#f0fafa',
          100: '#ccf0f0',
          200: '#99e0e0',
          300: '#5fcece',
          400: '#2eb8b8',
          500: '#0f9e9e',
          600: '#0a7d7d',
          700: '#085f5f',
          800: '#064444',
          900: '#042e2e',
        },
        surface: {
          DEFAULT: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
