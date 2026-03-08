import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f9d406',
        danger: '#ef4444',
        success: '#22c55e',
        'background-dark': '#1a180b',
        'background-light': '#f8f8f5',
        'card-dark': '#2a2714',
        military: '#3f4234',
        'accent-cyan': '#06f9e9',
        'kakao-yellow': '#FEE500',
        'kakao-label': '#191919',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        pixel: ["'Press Start 2P'", 'monospace'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        shake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(-4px, 4px)' },
          '50%': { transform: 'translate(4px, -4px)' },
          '75%': { transform: 'translate(-4px, -4px)' },
        },
        'flash-white': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
        shake: 'shake 0.3s ease-in-out',
        'flash-white': 'flash-white 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
