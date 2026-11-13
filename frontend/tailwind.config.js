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
        fresh: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          'surface-alt': 'rgb(var(--color-surface-alt) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          text: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          'primary-soft': 'rgb(var(--color-primary-soft) / <alpha-value>)',
          'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
          warning: 'rgb(var(--color-warning) / <alpha-value>)',
          'warning-soft': 'rgb(var(--color-warning-soft) / <alpha-value>)',
          success: 'rgb(var(--color-success) / <alpha-value>)',
          info: 'rgb(var(--color-info) / <alpha-value>)',
          accent: 'rgb(var(--color-accent) / <alpha-value>)',
        },
        // Backward-compatible alias mapping banana.* to fresh.*
        banana: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          'surface-alt': 'rgb(var(--color-surface-alt) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          text: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--color-primary) / <alpha-value>)',
          'primary-soft': 'rgb(var(--color-primary-soft) / <alpha-value>)',
          accent: 'rgb(var(--color-accent) / <alpha-value>)',
          warning: 'rgb(var(--color-warning) / <alpha-value>)',
        },
        nutrient: {
          'calories-from': 'var(--nutrient-calories-from)',
          'calories-to': 'var(--nutrient-calories-to)',
          calories: 'var(--nutrient-calories-from)',
          protein: 'var(--nutrient-protein)',
          carbs: 'var(--nutrient-carbs)',
          fat: 'var(--nutrient-fat)',
          fiber: 'var(--nutrient-fiber)',
          sugar: 'var(--nutrient-sugar)',
          sodium: 'var(--nutrient-sodium)',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '"Noto Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'input': '12px',
        'plate': '999px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(60, 45, 30, 0.06)',
        'soft-lg': '0 4px 16px rgba(60, 45, 30, 0.08)',
        'plate': '0 4px 12px rgba(60, 45, 30, 0.08)',
        'warm': '0 2px 8px rgba(60, 45, 30, 0.06)',
        'warm-hover': '0 4px 16px rgba(60, 45, 30, 0.08)',
      },
    },
  },
  plugins: [],
}
