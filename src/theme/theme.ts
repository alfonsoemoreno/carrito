import { createTheme, type PaletteMode } from "@mui/material/styles";

function getPaletteTokens(mode: PaletteMode) {
  if (mode === "dark") {
    return {
      primary: {
        main: "#86a9eb",
        dark: "#6e93d8",
        light: "#a8c0f3",
      },
      secondary: {
        main: "#bfd5ff",
      },
      background: {
        default: "#0f141c",
        paper: "#18202c",
      },
      text: {
        primary: "#edf2fb",
        secondary: "#a8b6ca",
      },
      divider: "#2b3646",
      buttonOutlinedBorder: "#41516a",
      buttonOutlinedText: "#dbe7ff",
      cardBorder: "#293547",
      inputBackground: "#111925",
      checkbox: "#7f8da3",
      checkboxDisabled: "#556173",
    };
  }

  return {
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
    buttonOutlinedBorder: "#aeb6c2",
    buttonOutlinedText: "#1f3b68",
    cardBorder: "#d7d7d7",
    inputBackground: "#ffffff",
    checkbox: "#95a1af",
    checkboxDisabled: "#c2c9d1",
  };
}

export function getAppTheme(mode: PaletteMode) {
  const palette = getPaletteTokens(mode);

  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: palette.primary,
      secondary: palette.secondary,
      background: palette.background,
      text: palette.text,
      divider: palette.divider,
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
              backgroundColor: palette.primary.main,
              color: "#ffffff",
              "&:hover": {
                backgroundColor: palette.primary.dark,
                boxShadow: "none",
              },
            },
            "&.MuiButton-outlined": {
              borderColor: palette.buttonOutlinedBorder,
              color: palette.buttonOutlinedText,
              "&:hover": {
                borderColor: palette.primary.main,
                backgroundColor:
                  mode === "dark"
                    ? "rgba(134, 169, 235, 0.12)"
                    : "rgba(91, 120, 182, 0.05)",
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
            border: `1px solid ${palette.cardBorder}`,
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
      MuiCheckbox: {
        styleOverrides: {
          root: {
            padding: 6,
            color: palette.checkbox,
            borderRadius: 4,
            "&.Mui-checked": {
              color: palette.primary.main,
            },
            "&.Mui-disabled": {
              color: palette.checkboxDisabled,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: "4px !important",
            backgroundColor: palette.inputBackground,
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
}
