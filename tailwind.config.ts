import type { Config } from "tailwindcss";

// Ein einziger Akzent: Grün. Alles andere sind (leicht grün-getönte) Neutraltöne.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF7F2",
          100: "#D9EEE1",
          200: "#B3DCC3",
          300: "#82C29E",
          400: "#4FA478",
          500: "#2C8A5D",
          600: "#1F7049",
          700: "#195A3C",
          800: "#154831",
          900: "#103827",
        },
        ink: {
          DEFAULT: "#13201A",
          soft: "#3B4A43",
          muted: "#6B7A73",
          faint: "#A3AFA9",
        },
        line: "#E4EAE6",
        paper: "#FFFFFF",
        // Ausschließlich für „nicht verfügbar“ im Kalender
        busy: { DEFAULT: "#B94A43", bg: "#FBEFEE", line: "#F0D3D1" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        fa: ["var(--font-fa)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,40,28,.04), 0 4px 16px -4px rgba(16,40,28,.08)",
        lift: "0 2px 4px rgba(16,40,28,.04), 0 18px 40px -12px rgba(16,40,28,.18)",
        deep: "0 4px 8px rgba(16,40,28,.04), 0 32px 64px -20px rgba(16,40,28,.25)",
        ring: "0 0 0 4px rgba(44,138,93,.14)",
      },
      borderRadius: { xl2: "1.25rem", xl3: "1.75rem" },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        "step-in": { from: { opacity: "0", transform: "translateX(28px)" }, to: { opacity: "1", transform: "none" } },
        "step-back": { from: { opacity: "0", transform: "translateX(-28px)" }, to: { opacity: "1", transform: "none" } },
        pulseRing: { "0%": { boxShadow: "0 0 0 0 rgba(44,138,93,.35)" }, "100%": { boxShadow: "0 0 0 14px rgba(44,138,93,0)" } },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "fade-up": "fade-up .5s cubic-bezier(.2,.7,.2,1) both",
        "step-in": "step-in .45s cubic-bezier(.2,.7,.2,1) both",
        "step-back": "step-back .45s cubic-bezier(.2,.7,.2,1) both",
        pulseRing: "pulseRing 2.4s cubic-bezier(.2,.7,.2,1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
