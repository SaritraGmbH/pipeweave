/** @type {import('tailwindcss').Config} */
module.exports = {
  // In v4, most configuration is done in CSS via @theme
  // Only specify content paths here if needed
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}
