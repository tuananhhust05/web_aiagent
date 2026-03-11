import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Instrument Sans", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        atlas: {
          nav: "hsl(var(--atlas-nav))",
          "nav-foreground": "hsl(var(--atlas-nav-foreground))",
          "nav-active": "hsl(var(--atlas-nav-active))",
          "nav-hover": "hsl(var(--atlas-nav-hover))",
          success: "hsl(var(--atlas-success))",
          "success-foreground": "hsl(var(--atlas-success-foreground))",
          "success-light": "hsl(var(--atlas-success-light))",
          "success-border": "hsl(var(--atlas-success-border))",
          warning: "hsl(var(--atlas-warning))",
          "warning-foreground": "hsl(var(--atlas-warning-foreground))",
          "warning-light": "hsl(var(--atlas-warning-light))",
          "warning-border": "hsl(var(--atlas-warning-border))",
          urgent: "hsl(var(--atlas-urgent))",
          "urgent-light": "hsl(var(--atlas-urgent-light))",
          "urgent-border": "hsl(var(--atlas-urgent-border))",
          info: "hsl(var(--atlas-info))",
          "info-light": "hsl(var(--atlas-info-light))",
          "info-border": "hsl(var(--atlas-info-border))",
        },
        badge: {
          interested: "hsl(var(--badge-interested))",
          "not-interested": "hsl(var(--badge-not-interested))",
          "not-now": "hsl(var(--badge-not-now))",
          "do-not-contact": "hsl(var(--badge-do-not-contact))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        forskale: {
          green: "hsl(var(--forskale-green))",
          teal: "hsl(var(--forskale-teal))",
          blue: "hsl(var(--forskale-blue))",
          cyan: "hsl(var(--forskale-cyan))",
          lime: "hsl(var(--forskale-lime))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateY(10px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in 0.35s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
