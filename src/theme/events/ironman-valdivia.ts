import type { PaletteMode } from "@mui/material/styles";

export function getIronmanValdiviaPalette(mode: PaletteMode) {
  const dark = mode === "dark";
  return {
    primary: dark
      ? { main: "#7dc3dc", dark: "#a6d9eb", light: "#bfe7f4" }
      : { main: "#276e8a", dark: "#1b526a", light: "#6aabc4" },
    secondary: { main: dark ? "#ff8792" : "#c8293d" },
    background: { default: dark ? "#0b141c" : "#f3f6f8", paper: dark ? "#14222e" : "#ffffff" },
    text: { primary: dark ? "#edf5f8" : "#102330", secondary: dark ? "#b3c5d0" : "#526674" },
    divider: dark ? "#354958" : "#d5e0e6",
    inputBackground: dark ? "#10202c" : "#f8fbfc",
    cardBorder: dark ? "#354958" : "#d5e0e6",
    checkbox: dark ? "#b3c5d0" : "#526674",
    checkboxDisabled: dark ? "#718694" : "#8798a3",
  };
}
