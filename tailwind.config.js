/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border, 214.3 31.8% 91.4%))",
        input: "hsl(var(--input, 214.3 31.8% 91.4%))",
        ring: "hsl(var(--ring, 217.2 91.2% 59.8%))",
        background: "hsl(var(--background, 210 40% 98%))",
        foreground: "hsl(var(--foreground, 222.2 47.4% 11.2%))",
        primary: {
          DEFAULT: "#0f766e", // Trustworthy Teal
          foreground: "#ffffff",
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        secondary: {
          DEFAULT: "#475569", // Slate Slate
          foreground: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        triage: {
          p1: {
            DEFAULT: "#e11d48", // Rose 600 (P1 Critical)
            bg: "#fff1f2",
            border: "#fecdd3",
            text: "#9f1239",
          },
          p2: {
            DEFAULT: "#ea580c", // Orange 600 (P2 High)
            bg: "#fff7ed",
            border: "#ffedd5",
            text: "#9a3412",
          },
          p3: {
            DEFAULT: "#d97706", // Amber 600 (P3 Moderate)
            bg: "#fef3c7",
            border: "#fde68a",
            text: "#92400e",
          },
          p4: {
            DEFAULT: "#059669", // Emerald 600 (P4 Routine)
            bg: "#ecfdf5",
            border: "#a7f3d0",
            text: "#065f46",
          },
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
      boxShadow: {
        premium: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 8px -1px rgba(15, 23, 42, 0.03)",
        glass: "0 8px 32px 0 rgba(15, 23, 42, 0.06)",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      animation: {
        "pulse-subtle": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
}
