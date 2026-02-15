/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#030712', // Deep Void (Gray 950)
                surface: '#111827',    // Dark Slate (Gray 900)
                primary: '#8b5cf6',    // Violet 500
                secondary: '#94a3b8',  // Slate 400
                success: '#10b981',    // Emerald 500
                warning: '#f59e0b',    // Amber 500
                danger: '#ef4444',     // Red 500
                info: '#06b6d4',       // Cyan 500
                accent: '#d946ef',     // Fuchsia 500
            }
        },
    },
    plugins: [],
}
