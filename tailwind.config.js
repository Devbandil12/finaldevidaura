module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // Ensures Tailwind scans all components
  theme: {
    extend: {
      colors: {
        // Map Tailwind color names to your CSS variables (HSL values defined in src/index.css)
        // Use the `hsl(var(--...) / <alpha-value>)` form so Tailwind's `/<opacity>` syntax works (eg. `bg-gold/20`).
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
        popover: 'hsl(var(--popover) / <alpha-value>)',
        'popover-foreground': 'hsl(var(--popover-foreground) / <alpha-value>)',
        primary: 'hsl(var(--primary) / <alpha-value>)',
        'primary-foreground': 'hsl(var(--primary-foreground) / <alpha-value>)',
        secondary: 'hsl(var(--secondary) / <alpha-value>)',
        'secondary-foreground': 'hsl(var(--secondary-foreground) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
        destructive: 'hsl(var(--destructive) / <alpha-value>)',
        'destructive-foreground': 'hsl(var(--destructive-foreground) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',

        /* Luxury theme helpers */
        cream: 'hsl(var(--cream) / <alpha-value>)',
        'cream-dark': 'hsl(var(--cream-dark) / <alpha-value>)',
        'luxury-dark': 'hsl(var(--luxury-dark) / <alpha-value>)',
        'luxury-darker': 'hsl(var(--luxury-darker) / <alpha-value>)',
        gold: 'hsl(var(--gold) / <alpha-value>)',
        'gold-light': 'hsl(var(--gold-light) / <alpha-value>)',
        'gold-dark': 'hsl(var(--gold-dark) / <alpha-value>)',
        rose: 'hsl(var(--rose) / <alpha-value>)',
        'rose-light': 'hsl(var(--rose-light) / <alpha-value>)',
        bronze: 'hsl(var(--bronze) / <alpha-value>)',
        navy: 'hsl(var(--navy) / <alpha-value>)',
        'navy-light': 'hsl(var(--navy-light) / <alpha-value>)',

        /* Sidebar */
        'sidebar-background': 'hsl(var(--sidebar-background) / <alpha-value>)',
        'sidebar-foreground': 'hsl(var(--sidebar-foreground) / <alpha-value>)',
        'sidebar-primary': 'hsl(var(--sidebar-primary) / <alpha-value>)',
        'sidebar-primary-foreground': 'hsl(var(--sidebar-primary-foreground) / <alpha-value>)',
        'sidebar-accent': 'hsl(var(--sidebar-accent) / <alpha-value>)',
        'sidebar-accent-foreground': 'hsl(var(--sidebar-accent-foreground) / <alpha-value>)',
        'sidebar-border': 'hsl(var(--sidebar-border) / <alpha-value>)',
        'sidebar-ring': 'hsl(var(--sidebar-ring) / <alpha-value>)',
      },

      // Add the shimmer keyframes & animation used by the hero text
      keyframes: {
        shimmer: {
          '0%': { 'background-position': '-100% 0' },
          '100%': { 'background-position': '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [], // Ensure this is correctly placed inside the object
};
