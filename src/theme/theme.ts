import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#5b78b6",
      dark: "#446199",
      light: "#7f98cb",
    },
    secondary: {
      main: "#1f3b68",
    },
    background: {
      default: "#ececec",
      paper: "#ffffff",
    },
    text: {
      primary: "#222222",
      secondary: "#5e5e5e",
    },
    divider: "#d7d7d7",
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: "var(--font-sans), Arial, sans-serif",
    h2: {
      fontSize: "clamp(2.1rem, 4.8vw, 3.7rem)",
      lineHeight: 1.1,
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontSize: "clamp(1.65rem, 3.4vw, 2.65rem)",
      lineHeight: 1.15,
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontWeight: 700,
      fontSize: "1.1rem",
    },
    body1: {
      lineHeight: 1.65,
    },
    body2: {
      lineHeight: 1.55,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
    overline: {
      letterSpacing: "0.08em",
      fontWeight: 700,
      fontSize: "0.72rem",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "4px !important",
          paddingInline: 18,
          minHeight: 42,
          boxShadow: "none",
          "&.MuiButton-containedPrimary": {
            backgroundColor: "#5b78b6",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#49679f",
              boxShadow: "none",
            },
          },
          "&.MuiButton-outlined": {
            borderColor: "#aeb6c2",
            color: "#1f3b68",
            "&:hover": {
              borderColor: "#5b78b6",
              backgroundColor: "rgba(91, 120, 182, 0.05)",
            },
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: "6px !important",
          boxShadow: "none",
          border: "1px solid #d7d7d7",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "4px !important",
          fontWeight: 700,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "4px !important",
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: "4px !important",
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          paddingBottom: 12,
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
