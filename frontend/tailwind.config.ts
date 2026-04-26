import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono:  ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        board: {
          bg:                 '#0E0E10',
          surface:            '#16161A',
          'surface-elevated': '#1C1C22',
          border:             '#26262C',
        },
        ink: {
          primary:   '#F5F5F4',
          secondary: '#A1A1AA',
          tertiary:  '#71717A',
        },
        gold:         '#E8B931',
        'chess-win':  '#22C55E',
        'chess-loss': '#DC2626',
        'chess-warn': '#D97706',
      },
    },
  },
  plugins: [],
};
export default config;
