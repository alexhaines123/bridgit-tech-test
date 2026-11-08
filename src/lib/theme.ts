import { createTheme } from "@mui/material/styles";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const palette = {
  mode: "dark" as const,

  // Surface colours
  background: {
    default: "#0d1117",
    paper: "#161b22",
  },

  // Text colours
  text: {
    primary: "#e6edf3",
    secondary: "#8b949e",
    disabled: "#484f58",
  },

  // Accent colours (mapped to MUI slots)
  primary: {
    main: "#58a6ff",
    light: "#79c0ff",
    dark: "#1f6feb",
    contrastText: "#0d1117",
  },
  success: {
    main: "#3fb950",
    light: "#56d364",
    dark: "#238636",
  },
  warning: {
    main: "#d29922",
    light: "#e3b341",
    dark: "#9e6a03",
  },
  error: {
    main: "#f85149",
    light: "#ff7b72",
    dark: "#da3633",
  },
  info: {
    main: "#58a6ff",
    light: "#79c0ff",
    dark: "#1f6feb",
  },

  // Dividers
  divider: "#30363d",
};

// ---------------------------------------------------------------------------
// Category colours (custom tokens)
// ---------------------------------------------------------------------------

export const categoryColors: Record<string, string> = {
  drought: "#d4a017",
  dustHaze: "#c9a87c",
  earthquakes: "#a371f7",
  floods: "#388bfd",
  landslides: "#9e7756",
  manmade: "#8b949e",
  seaLakeIce: "#39c5cf",
  severeStorms: "#6e77ff",
  snow: "#79c0ff",
  tempExtremes: "#f0883e",
  volcanoes: "#f85149",
  waterColor: "#2ea98f",
  wildfires: "#f0883e",
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

const typography = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  h1: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.4 },
  subtitle1: { fontSize: "1rem", fontWeight: 500, lineHeight: 1.5 },
  body1: { fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 },
  body2: { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.4 },
  overline: {
    fontSize: "0.625rem",
    fontWeight: 600,
    lineHeight: 1.6,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  },
  button: { fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.5 },
};

// ---------------------------------------------------------------------------
// Shape (border radii)
// ---------------------------------------------------------------------------

const shape = {
  borderRadius: 8, // md default; sm=4, lg=12 used in components
};

// ---------------------------------------------------------------------------
// Theme assembly
// ---------------------------------------------------------------------------

export const theme = createTheme({
  palette,
  typography,
  shape,
  spacing: 4, // 4px base unit

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.background.default,
          color: palette.text.primary,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: palette.background.paper,
          borderColor: palette.divider,
          borderWidth: 1,
          borderStyle: "solid",
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none" as const,
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Extended theme types (for custom tokens)
// ---------------------------------------------------------------------------

declare module "@mui/material/styles" {
  interface Theme {
    custom: {
      categoryColors: Record<string, string>;
      bg: {
        elevated: string;
        subtle: string;
      };
      border: {
        subtle: string;
      };
      stale: {
        banner: string;
        bannerText: string;
      };
      ai: {
        degraded: string;
      };
      psi: {
        low: string;
        medium: string;
        high: string;
      };
    };
  }
  interface ThemeOptions {
    custom?: {
      categoryColors: Record<string, string>;
      bg: {
        elevated: string;
        subtle: string;
      };
      border: {
        subtle: string;
      };
      stale: {
        banner: string;
        bannerText: string;
      };
      ai: {
        degraded: string;
      };
      psi: {
        low: string;
        medium: string;
        high: string;
      };
    };
  }
}

// Re-create the theme with custom tokens attached
export const appTheme = createTheme(theme, {
  custom: {
    categoryColors,
    bg: {
      elevated: "#1c2128",
      subtle: "#21262d",
    },
    border: {
      subtle: "#21262d",
    },
    stale: {
      banner: "#d29922",
      bannerText: "#d29922",
    },
    ai: {
      degraded: "#8b949e",
    },
    psi: {
      low: "#3fb950",
      medium: "#d29922",
      high: "#f85149",
    },
  },
});
