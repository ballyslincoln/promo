/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                ballys: {
                    red: '#E60000', // Vivid Bally's Red
                    darkRed: '#B30000',
                    black: '#000000',
                    gold: '#FFD700', // Excitement/Win
                    blue: '#0057B8', // Electric Blue (as per search)
                },
                // Overriding previous semantic names for the new theme
                primary: '#E60000',
                'primary-dark': '#B30000',
                secondary: '#0057B8',
                accent: '#FFD700',
                background: '#F8F9FA', // Light, clean background
                surface: '#FFFFFF',    // Card background
                text: {
                    main: '#111827', // Gray 900
                    muted: '#6B7280', // Gray 500
                    light: '#9CA3AF', // Gray 400
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'], // Ensure a clean font
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                }
            }
        },
    },
    plugins: [],
}
