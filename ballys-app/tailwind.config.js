/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                white: '#ffffff',
                black: '#000000',
                primary: 'var(--color-primary)',
                'primary-dark': 'var(--color-primary-dark)',
                accent: 'var(--color-accent)',
                bg: 'var(--color-bg)',
                'card-bg': 'var(--color-card-bg)',
                'card-border': 'var(--color-card-border)',
            },
            fontFamily: {
                sans: ['var(--font-sans)'],
            }
        },
    },
    plugins: [],
}
