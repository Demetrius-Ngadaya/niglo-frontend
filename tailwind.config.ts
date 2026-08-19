import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#181410',       // near-black warm charcoal
        brass: '#B8863B',     // brass/amber accent — gypsum lighting, tile trim
        brassLight: '#D9A857',
        stone: '#EDE8DF',     // warm stone/plaster background
        stoneDark: '#DDD5C6',
        concrete: '#8B8478',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
};

export default config;
