import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#146356",
      dark: "#0d463d",
      light: "#4f8f84",
    },
    secondary: {
      main: "#d17b49",
    },
    background: {
      default: "#f4efe6",
      paper: "#fffaf2",
    },
    text: {
      primary: "#1d2420",
      secondary: "#5e645f",
    },
    divider: "rgba(29, 36, 32, 0.12)",
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: "var(--font-manrope), sans-serif",
    h2: {
      fontSize: "clamp(2.3rem, 5vw, 4rem)",
      lineHeight: 1,
      fontWeight: 800,
      letterSpacing: "-0.04em",
    },
    h3: {
      fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
      lineHeight: 1.05,
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
    overline: {
      letterSpacing: "0.14em",
      fontWeight: 800,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 20,
          minHeight: 44,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          boxShadow: "0 14px 40px rgba(29, 36, 32, 0.06)",
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: "lg",
      },
    },
  },
});

export default theme;
