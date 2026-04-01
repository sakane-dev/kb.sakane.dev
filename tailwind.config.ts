import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        "tertiary": "#ddb7ff",
        "on-error-container": "#ffdad6",
        "secondary-container": "#39485a",
        "on-tertiary-fixed-variant": "#6900b3",
        "surface-container-highest": "#343537",
        "on-tertiary": "#490080",
        "on-primary-container": "#f4f1ff",
        "inverse-surface": "#e3e2e5",
        "error-container": "#93000a",
        "surface-container-lowest": "#0d0e10",
        "error": "#ffb4ab",
        "surface-container-high": "#292a2c",
        "surface-container": "#1f2022",
        "outline": "#918fa0",
        "secondary": "#b9c8de",
        "on-tertiary-fixed": "#2c0051",
        "on-secondary-container": "#a7b6cc",
        "tertiary-fixed": "#f0dbff",
        "surface-dim": "#121315",
        "on-error": "#690005",
        "on-background": "#e3e2e5",
        "secondary-fixed-dim": "#b9c8de",
        "on-secondary": "#233143",
        "surface-container-low": "#1b1c1e",
        "primary-container": "#5e5ce6",
        "inverse-primary": "#4d4ad5",
        "surface-bright": "#38393b",
        "on-primary-fixed": "#0c006b",
        "primary-fixed": "#e2dfff",
        "tertiary-fixed-dim": "#ddb7ff",
        "secondary-fixed": "#d4e4fa",
        "primary": "#c2c1ff",
        "on-secondary-fixed": "#0d1c2d",
        "background": "#121315",
        "on-surface": "#e3e2e5",
        "on-surface-variant": "#c7c4d7",
        "primary-fixed-dim": "#c2c1ff",
        "on-tertiary-container": "#fbefff",
        "on-secondary-fixed-variant": "#39485a",
        "surface-tint": "#c2c1ff",
        "on-primary-fixed-variant": "#332dbc",
        "inverse-on-surface": "#303033",
        "on-primary": "#1800a7",
        "surface": "#121315",
        "outline-variant": "#464554",
        "surface-variant": "#343537",
        "tertiary-container": "#9541e4"
      },
      fontFamily: {
        "headline": ["Inter", "sans-serif"],
        "body": ["Newsreader", "serif"],
        "label": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
    },
  },
  plugins: [],
}

export default config
