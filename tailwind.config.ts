import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0D0D0D',
          50: '#F5F5F0',
          100: '#E8E8E0',
          200: '#C8C8B8',
          300: '#A0A090',
          400: '#707068',
          500: '#484840',
          600: '#2C2C28',
          700: '#1A1A18',
          800: '#111110',
          900: '#0D0D0D',
        },
        jade: {
          DEFAULT: '#00A878',
          50: '#E8FFF8',
          100: '#C0FFEC',
          200: '#80FFDA',
          300: '#40EFC0',
          400: '#00D49A',
          500: '#00A878',
          600: '#007A58',
          700: '#005540',
          800: '#003328',
          900: '#001A14',
        },
        amber: {
          DEFAULT: '#F5A623',
          light: '#FFF3D4',
        },
        coral: {
          DEFAULT: '#FF6B6B',
          light: '#FFE8E8',
        },
      },
      animation: {
        'flip-in': 'flipIn 0.4s ease-out',
        'flip-out': 'flipOut 0.4s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'shimmer': 'shimmer 2s infinite',
        'pulse-jade': 'pulseJade 2s infinite',
      },
      keyframes: {
        flipIn: {
          '0%': { transform: 'rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        flipOut: {
          '0%': { transform: 'rotateY(0deg)', opacity: '1' },
          '100%': { transform: 'rotateY(-90deg)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseJade: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 168, 120, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(0, 168, 120, 0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
