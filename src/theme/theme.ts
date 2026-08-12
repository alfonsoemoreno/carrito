import { createTheme, type PaletteMode } from "@mui/material/styles";

function getPaletteTokens(mode: PaletteMode) {
  if (mode === "dark") {
    return {
      primary: { main: "#a8c7fa", dark: "#7ba5e8", light: "#d3e3fd" },
      secondary: { main: "#d8b4fe" },
      background: { default: "#101418", paper: "#191c20" },
      text: { primary: "#e3e2e6", secondary: "#c4c7c5" },
      divider: "#44474e",
      inputBackground: "#1d2025",
      cardBorder: "#44474e",
      checkbox: "#c4c7c5",
      checkboxDisabled: "#767a80",
    };
  }

  return {
    primary: { main: "#0b57d0", dark: "#0842a0", light: "#d3e3fd" },
    secondary: { main: "#7b1fa2" },
    background: { default: "#f8fafd", paper: "#ffffff" },
    text: { primary: "#1f1f1f", secondary: "#5f6368" },
    divider: "#e1e3e6",
    inputBackground: "#f8fafd",
    cardBorder: "#e1e3e6",
    checkbox: "#5f6368",
    checkboxDisabled: "#9aa0a6",
  };
}

export function getAppTheme(mode: PaletteMode) {
  const palette = getPaletteTokens(mode);
  const primaryWash = mode === "dark" ? "rgba(168, 199, 250, 0.14)" : "#e8f0fe";

  return createTheme({
    palette: {
      mode,
      primary: palette.primary,
      secondary: palette.secondary,
      background: palette.background,
      text: palette.text,
      divider: palette.divider,
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: "var(--font-sans), Arial, sans-serif",
      h2: { fontSize: "clamp(2.15rem, 4.8vw, 3.7rem)", lineHeight: 1.08, fontWeight: 650, letterSpacing: "-0.035em" },
      h3: { fontSize: "clamp(1.7rem, 3.4vw, 2.55rem)", lineHeight: 1.12, fontWeight: 650, letterSpacing: "-0.03em" },
      h4: { fontWeight: 650, letterSpacing: "-0.02em" },
      h5: { fontSize: "1.14rem", fontWeight: 650, letterSpacing: "-0.01em" },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.5 },
      button: { textTransform: "none", fontWeight: 650, letterSpacing: 0 },
      overline: { letterSpacing: "0.1em", fontWeight: 700, fontSize: "0.7rem", lineHeight: 1.5 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 20,
            minHeight: 42,
            boxShadow: "none",
            transition: "background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
            "&:hover": { boxShadow: "0 2px 5px rgba(60, 64, 67, 0.18)" },
            "&:active": { transform: "translateY(1px)" },
            "&.MuiButton-containedPrimary": {
              backgroundColor: palette.primary.main,
              color: mode === "dark" ? "#062e6f" : "#ffffff",
              "&:hover": { backgroundColor: palette.primary.dark },
            },
            "&.MuiButton-outlined": {
              borderColor: palette.divider,
              color: palette.primary.main,
              backgroundColor: "transparent",
              "&:hover": { borderColor: "transparent", backgroundColor: primaryWash },
            },
            "&.MuiButton-text": { "&:hover": { backgroundColor: primaryWash } },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: 12, transition: "background-color 160ms ease, transform 160ms ease", "&:hover": { backgroundColor: primaryWash }, "&:active": { transform: "scale(0.96)" } } },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { borderRadius: 20, boxShadow: "0 1px 2px rgba(60, 64, 67, 0.06)", border: `1px solid ${palette.cardBorder}` } },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 16 },
        },
      },
      MuiCardContent: {
        styleOverrides: { root: { padding: 28, "&:last-child": { paddingBottom: 28 }, "@media (max-width:600px)": { padding: 20, "&:last-child": { paddingBottom: 20 } } } },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 650, height: 30 } } },
      MuiCheckbox: { styleOverrides: { root: { padding: 7, color: palette.checkbox, "&.Mui-checked": { color: palette.primary.main }, "&.Mui-disabled": { color: palette.checkboxDisabled } } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 12, backgroundColor: palette.inputBackground, transition: "background-color 160ms ease", "&.Mui-focused": { boxShadow: "none" } },
          input: { paddingTop: 14, paddingBottom: 14 },
          notchedOutline: { borderColor: palette.divider },
        },
      },
      MuiInputLabel: { styleOverrides: { root: { fontWeight: 600, fontSize: "0.88rem" } } },
      MuiMenu: { styleOverrides: { paper: { marginTop: 8, borderRadius: 16, border: `1px solid ${palette.divider}`, boxShadow: "0 8px 24px rgba(60, 64, 67, 0.16)" } } },
      MuiMenuItem: { styleOverrides: { root: { minHeight: 46, margin: "3px 6px", borderRadius: 10, paddingInline: 14, "&.Mui-selected": { backgroundColor: primaryWash } } } },
      MuiAutocomplete: { styleOverrides: { paper: { borderRadius: 16 }, option: { minHeight: 48, borderRadius: 8, margin: "2px 6px" } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 14, padding: "12px 16px" } } },
      MuiAccordion: {
        styleOverrides: {
          root: {
            border: `1px solid ${palette.divider}`,
            borderRadius: "16px !important",
            overflow: "hidden",
            boxShadow: "none",
            "&:before": { display: "none" },
            "&.Mui-expanded": { margin: 0 },
          },
        },
      },
      MuiAccordionSummary: { styleOverrides: { root: { minHeight: 60, paddingInline: 20, "&.Mui-expanded": { minHeight: 60 } }, content: { marginBlock: 14, "&.Mui-expanded": { marginBlock: 14 } } } },
      MuiTableContainer: { styleOverrides: { root: { border: `1px solid ${palette.divider}`, borderRadius: 16, overflow: "hidden" } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: palette.divider, padding: "14px 16px" },
          head: { backgroundColor: mode === "dark" ? "#22252a" : "#f8fafd", color: palette.text.secondary, fontWeight: 700, fontSize: "0.76rem", letterSpacing: "0.06em", textTransform: "uppercase" },
        },
      },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: "3px 3px 0 0" } } },
      MuiTab: { styleOverrides: { root: { minHeight: 48, minWidth: 0, paddingInline: 16, textTransform: "none", fontWeight: 650 } } },
      MuiPaginationItem: { styleOverrides: { root: { borderRadius: 10, minWidth: 36, height: 36 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 24, border: `1px solid ${palette.divider}`, boxShadow: "0 24px 64px rgba(60, 64, 67, 0.22)" } } },
      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: "0.76rem", padding: "7px 10px" } } },
      MuiCardHeader: { styleOverrides: { root: { paddingBottom: 12 } } },
      MuiContainer: { defaultProps: { maxWidth: "lg" }, styleOverrides: { root: { paddingLeft: "clamp(20px, 4.5vw, 40px)", paddingRight: "clamp(20px, 4.5vw, 40px)" } } },
    },
  });
}
