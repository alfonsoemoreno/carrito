import { createTheme, type PaletteMode } from "@mui/material/styles";
import { ACTIVE_EVENT_THEME, type EventThemeId } from "@/theme/event-theme";
import { getTourDeFrancePalette } from "@/theme/events/tour-de-france";
import { getIronmanValdiviaPalette } from "@/theme/events/ironman-valdivia";

export function getAppTheme(mode: PaletteMode, eventTheme: EventThemeId = ACTIVE_EVENT_THEME) {
  const palette = eventTheme === "tour-de-france" ? getTourDeFrancePalette(mode) : getIronmanValdiviaPalette(mode);
  const primaryWash = eventTheme === "tour-de-france"
    ? (mode === "dark" ? "rgba(245, 237, 0, 0.18)" : "rgba(245, 237, 0, 0.24)")
    : (mode === "dark" ? "rgba(125, 195, 220, 0.18)" : "rgba(39, 110, 138, 0.12)");

  return createTheme({
    palette: {
      mode,
      primary: palette.primary,
      secondary: palette.secondary,
      background: palette.background,
      text: palette.text,
      divider: palette.divider,
      action: { selected: primaryWash },
    },
    shape: { borderRadius: 0 },
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
            borderRadius: 0,
            paddingInline: 20,
            minHeight: 42,
            boxShadow: "none",
            transition: "background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
            "&:hover": { boxShadow: "0 2px 5px rgba(60, 64, 67, 0.18)" },
            "&:active": { transform: "translateY(1px)" },
            "&.MuiButton-containedPrimary": {
              backgroundColor: palette.primary.main,
              color: eventTheme === "tour-de-france" ? "#111111" : mode === "dark" ? "#071e2a" : "#ffffff",
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
        styleOverrides: { root: { borderRadius: 0, transition: "background-color 160ms ease, transform 160ms ease", "&:hover": { backgroundColor: primaryWash }, "&:active": { transform: "scale(0.98)" } } },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { borderRadius: 0, boxShadow: "0 1px 2px rgba(60, 64, 67, 0.06)", border: `1px solid ${palette.cardBorder}` } },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 0 },
        },
      },
      MuiCardContent: {
        styleOverrides: { root: { padding: 28, "&:last-child": { paddingBottom: 28 }, "@media (max-width:600px)": { padding: 20, "&:last-child": { paddingBottom: 20 } } } },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 0, fontWeight: 650, height: 30 } } },
      MuiCheckbox: { styleOverrides: { root: { padding: 7, color: palette.checkbox, "&.Mui-checked": { color: palette.primary.main }, "&.Mui-disabled": { color: palette.checkboxDisabled } } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 0, backgroundColor: palette.inputBackground, transition: "background-color 160ms ease", "&.Mui-focused": { boxShadow: "none" } },
          input: { paddingTop: 14, paddingBottom: 14 },
          notchedOutline: { borderColor: palette.divider },
        },
      },
      MuiInputLabel: { styleOverrides: { root: { fontWeight: 600, fontSize: "0.88rem" } } },
      MuiMenu: { styleOverrides: { paper: { marginTop: 8, borderRadius: 0, border: `1px solid ${palette.divider}`, boxShadow: "0 8px 24px rgba(60, 64, 67, 0.16)" } } },
      MuiMenuItem: { styleOverrides: { root: { minHeight: 46, margin: 0, borderRadius: 0, paddingInline: 14, "&.Mui-selected": { backgroundColor: primaryWash } } } },
      MuiAutocomplete: { styleOverrides: { paper: { borderRadius: 0 }, option: { minHeight: 48, borderRadius: 0, margin: 0 } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 0, padding: "12px 16px" } } },
      MuiAccordion: {
        styleOverrides: {
          root: {
            border: `1px solid ${palette.divider}`,
            borderRadius: "0 !important",
            overflow: "hidden",
            boxShadow: "none",
            "&:before": { display: "none" },
            "&.Mui-expanded": { margin: 0 },
          },
        },
      },
      MuiAccordionSummary: { styleOverrides: { root: { minHeight: 60, paddingInline: 20, "&.Mui-expanded": { minHeight: 60 } }, content: { marginBlock: 14, "&.Mui-expanded": { marginBlock: 14 } } } },
      MuiTableContainer: { styleOverrides: { root: { border: `1px solid ${palette.divider}`, borderRadius: 0, overflow: "hidden" } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: palette.divider, padding: "14px 16px" },
          head: { backgroundColor: mode === "dark" ? "#22252a" : "#f8fafd", color: palette.text.secondary, fontWeight: 700, fontSize: "0.76rem", letterSpacing: "0.06em", textTransform: "uppercase" },
        },
      },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 0 } } },
      MuiTab: { styleOverrides: { root: { minHeight: 48, minWidth: 0, paddingInline: 16, textTransform: "none", fontWeight: 650 } } },
      MuiPaginationItem: { styleOverrides: { root: { borderRadius: 0, minWidth: 36, height: 36 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 0, border: `1px solid ${palette.divider}`, boxShadow: "0 24px 64px rgba(60, 64, 67, 0.22)" } } },
      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 0, fontSize: "0.76rem", padding: "7px 10px" } } },
      MuiCardHeader: { styleOverrides: { root: { paddingBottom: 12 } } },
      MuiContainer: { defaultProps: { maxWidth: "lg" }, styleOverrides: { root: { paddingLeft: "clamp(20px, 4.5vw, 40px)", paddingRight: "clamp(20px, 4.5vw, 40px)" } } },
    },
  });
}
