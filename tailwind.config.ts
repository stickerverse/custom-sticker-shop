import type { Config } from "tailwindcss";
export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2))",
        "glass-gradient-dark":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))",
        "glow-blue":
          "radial-gradient(circle, rgba(65, 135, 255, 0.2) 0%, transparent 70%)",
        "glow-purple":
          "radial-gradient(circle, rgba(138, 75, 255, 0.2) 0%, transparent 70%)",
        shimmer:
          "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)",
        "soft-gradient": "linear-gradient(135deg, #f9fafb, #f3f4f6)",
        "calm-overlay":
          "linear-gradient(to right, rgba(236, 252, 255, 0.7), rgba(244, 247, 255, 0.7))",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
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
        // New glass colors
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.65)",
          light: "rgba(255, 255, 255, 0.8)",
          dark: "rgba(255, 255, 255, 0.4)",
          border: "rgba(255, 255, 255, 0.18)",
          "dark-bg": "rgba(15, 23, 42, 0.65)",
        },
        glow: {
          blue: "rgba(65, 135, 255, 0.35)",
          purple: "rgba(138, 75, 255, 0.35)",
          cyan: "rgba(34, 211, 238, 0.35)",
          green: "rgba(34, 197, 94, 0.35)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 15px rgba(124, 58, 237, 0.7)",
          },
          "50%": {
            opacity: "0.6",
            boxShadow: "0 0 25px rgba(124, 58, 237, 0.3)",
          },
        },
        "bubble-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.8)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "gentle-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "card-hover": {
          "0%": {
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
          },
          "100%": {
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            transform: "translateY(-5px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bubble-in": "bubble-in 0.3s ease-out forwards",
        shimmer: "shimmer 2s infinite",
        "gentle-pulse": "gentle-pulse 3s ease-in-out infinite",
        "card-hover": "card-hover 0.3s ease-out forwards",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.1)",
        "glass-lg": "0 8px 32px rgba(0, 0, 0, 0.1)",
        "glass-sm": "0 2px 16px rgba(0, 0, 0, 0.05)",
        "glass-inner": "inset 0 1px 2px rgba(255, 255, 255, 0.5)",
        float: "0 10px 30px -5px rgba(0, 0, 0, 0.05)",
        "float-lg": "0 20px 40px -5px rgba(0, 0, 0, 0.1)",
        "glow-blue": "0 0 20px rgba(65, 135, 255, 0.4)",
        "glow-purple": "0 0 20px rgba(138, 75, 255, 0.4)",
        soft: "0 2px 15px rgba(0, 0, 0, 0.02), 0 2px 5px rgba(0, 0, 0, 0.02)",
        "soft-lg":
          "10px 10px 20px rgba(0, 0, 0, 0.04), -10px -10px 20px rgba(255, 255, 255, 0.8)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    function ({ addComponents }) {
      addComponents({
        ".glass-card": {
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(8px)",
          borderRadius: "0.75rem",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            transform: "translateY(-3px)",
          },
        },
        ".glass-dark": {
          backgroundColor: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(8px)",
          borderRadius: "0.75rem",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
        },
        ".float-element": {
          animation: "float 6s ease-in-out infinite",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.05)",
        },
        ".float-element-slow": {
          animation: "float-slow 8s ease-in-out infinite",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.05)",
        },
        ".hover-float": {
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 20px 40px -5px rgba(0, 0, 0, 0.1)",
          },
        },
        ".shimmer-effect": {
          position: "relative",
          overflow: "hidden",
          "&::after": {
            position: "absolute",
            top: "0",
            right: "0",
            bottom: "0",
            left: "0",
            transform: "translateX(-100%)",
            backgroundImage:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
            animation: "shimmer 2s infinite",
            content: '""',
          },
        },
        ".glow-on-hover": {
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            zIndex: "-1",
            borderRadius: "inherit",
            opacity: "0",
            transition: "opacity 0.3s ease",
            background:
              "radial-gradient(circle at center, rgba(65, 135, 255, 0.4) 0%, transparent 70%)",
          },
          "&:hover::after": {
            opacity: "1",
          },
        },
        ".calming-bg": {
          background: "linear-gradient(135deg, #f5f7ff 0%, #e0f7fa 100%)",
        },
      });
    },
    function ({ addUtilities }) {
      const newUtilities = {
        ".backdrop-blur-xs": {
          backdropFilter: "blur(2px)",
        },
        ".backdrop-blur-sm": {
          backdropFilter: "blur(4px)",
        },
        ".backdrop-blur": {
          backdropFilter: "blur(8px)",
        },
        ".backdrop-blur-md": {
          backdropFilter: "blur(12px)",
        },
        ".backdrop-blur-lg": {
          backdropFilter: "blur(16px)",
        },
        ".backdrop-blur-xl": {
          backdropFilter: "blur(24px)",
        },
      };
      addUtilities(newUtilities);
    },
  ],
} satisfies Config;
