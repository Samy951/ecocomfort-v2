/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // Design System Colors
      colors: {
        // Primary Colors
        "main-green": "#2FCE65",
        "main-black": "#101010",
        "main-white": "#FFFFFF",
        "dark-green": "#07503E",

        // Greyscale
        "dark-grey": "#434649",
        "medium-grey": "#888C8F",
        grey: "#CDCED0",
        "light-grey": "#F2F2F2",
        "extra-light-grey": "#FAFAFA",

        // System Colors
        error: "#FF5A5A",
        success: "#2FCE65", // main-green
        warning: "#F59E0B", // amber-500 equivalent
        info: "#3B82F6", // blue-500 equivalent
        critical: "#EF4444", // red-500 equivalent

        // Extended Color Palette
        algae: {
          70: "#518478",
          30: "#9CB9B2",
        },
        emerald: {
          70: "#88E2A6",
          30: "#BBEECC",
        },
        cornflower: {
          dark: "#3A559D",
          DEFAULT: "#7696F3",
          70: "#BBCAF2",
          30: "#E9EDFB",
        },
        heliotrope: {
          dark: "#6C43AE",
          DEFAULT: "#B486FF",
          70: "#DBCAF7",
          30: "#F3EEFD",
        },
        pink: {
          dark: "#9E499B",
          DEFAULT: "#FC8AF7",
          70: "#F7CAF5",
          30: "#FDEEFC",
        },
        aqua: {
          dark: "#278D81",
          DEFAULT: "#58D0C2",
          70: "#CFF7F2",
          30: "#EEFFFD",
        },
        anakiwa: {
          dark: "#2A7097",
          DEFAULT: "#75CBF0",
          70: "#CAEDFD",
          30: "#E9F8FF",
        },
        grandis: {
          dark: "#D69E3C",
          DEFAULT: "#FFD489",
          70: "#FCEBCC",
          30: "#FEF9EE",
        },
      },

      // Typography
      fontFamily: {
        pangea: ["Inter", "system-ui", "sans-serif"], // Alternative to Pangea
        inter: ["Inter", "system-ui", "sans-serif"],
      },

      // Font Sizes (Mobile-first)
      fontSize: {
        // Desktop Titles
        "h1-desktop": ["62px", { lineHeight: "110%", fontWeight: "700" }],
        "h2-desktop": ["42px", { lineHeight: "110%", fontWeight: "700" }],
        "h3-desktop": ["28px", { lineHeight: "110%", fontWeight: "700" }],
        "h4-desktop": ["22px", { lineHeight: "110%", fontWeight: "700" }],
        "h5-desktop": ["18px", { lineHeight: "110%", fontWeight: "700" }],

        // Mobile Titles
        "h1-mobile": ["38px", { lineHeight: "110%", fontWeight: "700" }],
        "h2-mobile": ["26px", { lineHeight: "110%", fontWeight: "700" }],
        "h3-mobile": ["22px", { lineHeight: "130%", fontWeight: "700" }],
        "h4-mobile": ["18px", { lineHeight: "130%", fontWeight: "700" }],
        "h5-mobile": ["16px", { lineHeight: "130%", fontWeight: "700" }],

        // Paragraphs
        "paragraph-big": ["18px", { lineHeight: "150%", fontWeight: "400" }],
        "paragraph-medium": ["16px", { lineHeight: "150%", fontWeight: "400" }],
        "paragraph-small": ["14px", { lineHeight: "150%", fontWeight: "400" }],
        "paragraph-tiny": ["11px", { lineHeight: "150%", fontWeight: "400" }],

        // Links
        "link-big": ["16px", { lineHeight: "130%", fontWeight: "700" }],
        "link-medium": ["14px", { lineHeight: "130%", fontWeight: "700" }],
        "link-small": ["12px", { lineHeight: "130%", fontWeight: "700" }],
      },

      // Button Heights (from design system)
      height: {
        "btn-big": "60px",
        "btn-medium": "50px",
        "btn-small": "40px",
        "btn-link": "20px",
      },

      // Spacing
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },

      // Border Radius
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },

      // Box Shadow
      boxShadow: {
        soft: "0 2px 8px rgba(16, 16, 16, 0.1)",
        medium: "0 4px 16px rgba(16, 16, 16, 0.15)",
        strong: "0 8px 32px rgba(16, 16, 16, 0.2)",
      },

      // Animation
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        300: "300ms",
      },

      // Backdrop Blur
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
