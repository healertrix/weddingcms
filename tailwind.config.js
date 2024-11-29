/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    // ... other content paths
  ],
  theme: {
    extend: {
      fontFamily: {
        gotu: ['var(--font-gotu)'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 