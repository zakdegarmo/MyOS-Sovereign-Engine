/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'space-black': '#050505',
                'space-dark': '#0a0a12',
                'neon-blue': '#00f3ff',
                'neon-purple': '#bd00ff',
                'glass-panel': 'rgba(255, 255, 255, 0.05)',
            },
            animation: {
                'spin-slow': 'spin 20s linear infinite',
            },
        },
    },
    plugins: [],
}
