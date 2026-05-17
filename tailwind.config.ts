import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'wa-green': '#075E54',
        'wa-green-light': '#128C7E',
        'wa-teal': '#25D366',
        'wa-bg': '#efeae2',
        'wa-sent': '#d9fdd3',
        'wa-panel': '#f0f2f5',
      },
    },
  },
  plugins: [],
}
export default config
