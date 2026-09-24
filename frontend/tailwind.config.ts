import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      fontSize: {
        'fluid-xs':   ['clamp(0.65rem, calc(1.2rem - 0.5vw), 0.75rem)',  { lineHeight: '1.4' }],
        'fluid-sm':   ['clamp(0.8rem,  calc(1.5rem - 0.8vw), 0.875rem)', { lineHeight: '1.5' }],
        'fluid-base': ['clamp(0.9rem,  calc(2rem - 1.2vw),   1rem)',      { lineHeight: '1.6' }],
        'fluid-lg':   ['clamp(1rem,    calc(2.5rem - 1.5vw), 1.125rem)', { lineHeight: '1.5' }],
        'fluid-xl':   ['clamp(1.1rem,  calc(3rem - 1.8vw),   1.25rem)',  { lineHeight: '1.4' }],
        'fluid-2xl':  ['clamp(1.25rem, calc(4rem - 2.5vw),   1.5rem)',   { lineHeight: '1.3' }],
        'fluid-3xl':  ['clamp(1.5rem,  calc(5rem - 3vw),     1.875rem)', { lineHeight: '1.2' }],
      },
    },
  },
} satisfies Config