/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ruby: {
          DEFAULT: '#CB2957',
          hover: '#b5234d',
          glow: 'rgba(203, 41, 87, 0.35)',
          light: '#fde8ef',
          dark: '#E03565',
        },
        obsidian: {
          DEFAULT: '#000000',
          card: '#121212',
          box: '#0A0A0A',
          pill: '#1E1E1E',
          border: '#2A2A2A',
        },
        alabaster: {
          DEFAULT: '#EEEEEE',
          card: '#FFFFFF',
          box: '#FFFFFF',
          pill: '#DDDDDD',
          border: '#DDDDDD',
        },
        silver: {
          DEFAULT: '#DDDDDD',
          dark: '#333333',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'ruby-sm': '0 2px 10px rgba(203, 41, 87, 0.25)',
        'ruby-lg': '0 8px 30px rgba(203, 41, 87, 0.35)',
        'elevation': '0 10px 40px -10px rgba(0, 0, 0, 0.12)',
        'elevation-dark': '0 10px 40px -10px rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [],
};
