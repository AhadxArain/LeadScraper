/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#000F22',
          800: '#042558',
          600: '#507CA9',
          500: '#5381B2',
          400: '#7E9FC8',
          100: '#C2E8FF',
        },
        success: {
          bg:     '#F0FDF4',
          border: '#86EFAC',
          text:   '#15803D',
          dot:    '#16A34A',
        },
        warning: {
          bg:     '#FFFBEB',
          border: '#FCD34D',
          text:   '#B45309',
          dot:    '#D97706',
        },
        error: {
          bg:     '#FEF2F2',
          border: '#FCA5A5',
          text:   '#B91C1C',
          dot:    '#DC2626',
        },
        info: {
          bg:     '#EFF6FF',
          border: '#C2E8FF',
          text:   '#042558',
          dot:    '#507CA9',
        },
        white: '#FFFFFF'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      fontSize: {
        xs:   ['11px', { lineHeight: '16px', letterSpacing: '0.05em' }],
        sm:   ['12px', { lineHeight: '18px' }],
        base: ['13px', { lineHeight: '20px' }],
        md:   ['14px', { lineHeight: '22px' }],
        lg:   ['16px', { lineHeight: '24px', fontWeight: '600' }],
        xl:   ['20px', { lineHeight: '28px', fontWeight: '700' }],
        '2xl':  ['24px', { lineHeight: '32px', fontWeight: '700' }]
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px'
      },
      boxShadow: {
        card:    '0 1px 2px rgba(16,24,40,0.05)',
        md:      '0 4px 8px -2px rgba(16,24,40,0.08), 0 2px 4px -2px rgba(16,24,40,0.04)',
        lg:      '0 12px 16px -4px rgba(16,24,40,0.08), 0 4px 6px -2px rgba(16,24,40,0.04)',
        modal:   '0 20px 40px -4px rgba(16,24,40,0.14)'
      }
    },
  },
  plugins: [],
}
