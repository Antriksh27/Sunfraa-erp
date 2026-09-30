import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "#181d26",
          active: "#0d1218",
        },
        ink: {
          DEFAULT: "#181d26",
          active: "#0d1218",
          body: "#333840",
          muted: "#64748b",
          light: "#9297a0",
        },
        canvas: "#ffffff",
        hairline: "#e2e8f0",
        "border-subtle": "#e2e8f0",
        "border-strong": "#9297a0",
        surface: {
          soft: "#f8fafc",
          strong: "#e0e2e6",
          dark: "#181d26",
          "dark-elevated": "#1d1f25",
        },
        signature: {
          coral: "#aa2d00",
          "coral-soft": "#fff0eb",
          forest: "#0a2e0e",
          "forest-soft": "#ecfdf5",
          cream: "#f5e9d4",
          "cream-soft": "#fdfbf7",
          peach: "#fcab79",
          mint: "#a8d8c4",
          yellow: "#f4d35e",
          mustard: "#d9a441",
        },
        brand: {
          link: "#1b61c9",
          "link-active": "#1a3866",
          info: "#254fad",
          "info-border": "#458fff",
          success: "#006400",
          "success-border": "#39bf45",
        },
        solar: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
      },
      borderRadius: {
        xs: "2px",
        sm: "6px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(24, 29, 38, 0.04)",
        "xs": "0 1px 3px 0 rgba(24, 29, 38, 0.08), 0 1px 2px -1px rgba(24, 29, 38, 0.08)",
        "card": "0 2px 4px 0 rgba(24, 29, 38, 0.04), 0 1px 2px 0 rgba(24, 29, 38, 0.02)",
        "card-hover": "0 4px 12px 0 rgba(24, 29, 38, 0.08), 0 2px 4px 0 rgba(24, 29, 38, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
