import type { PaletteMode } from "@mui/material/styles";

export function getTourDeFrancePalette(mode: PaletteMode) {
  if (mode === "dark") {
    return {
      primary: { main: "#f5ed00", dark: "#ddd500", light: "#fff58a" },
      secondary: { main: "#fff58a" },
      background: { default: "#101418", paper: "#191c20" },
      text: { primary: "#e3e2e6", secondary: "#c4c7c5" },
      divider: "#44474e",
      inputBackground: "#1d2025",
      cardBorder: "#44474e",
      checkbox: "#c2c2c2",
      checkboxDisabled: "#767676",
    };
  }

  return {
    primary: { main: "#111111", dark: "#000000", light: "#f5ed00" },
    secondary: { main: "#f5ed00" },
    background: { default: "#ffffff", paper: "#ffffff" },
    text: { primary: "#111111", secondary: "#5b5b5b" },
    divider: "#dedede",
    inputBackground: "#fdfdf8",
    cardBorder: "#dedede",
    checkbox: "#5b5b5b",
    checkboxDisabled: "#999999",
  };
}

