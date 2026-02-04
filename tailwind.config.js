
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-green': '#024930',
                'brand-pink': '#FEACCF',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Bona Nova', 'serif'],
                display: ['Playfair Display', 'serif'],
                script: ['Pinyon Script', 'cursive'],
                mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
            },
        },
    },
    plugins: [],
}
