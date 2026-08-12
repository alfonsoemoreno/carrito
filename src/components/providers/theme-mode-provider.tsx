"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CssBaseline, ThemeProvider, type PaletteMode } from "@mui/material";
import { getAppTheme } from "@/theme/theme";

type ThemeModeContextValue = {
  mode: PaletteMode;
  setMode: (mode: PaletteMode) => void;
  toggleMode: () => void;
};

const STORAGE_KEY = "carrito-color-mode";
const MODE_EVENT = "carrito-color-mode-change";

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function getStoredMode(): PaletteMode {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribeToMode(onStoreChange: () => void) {
  window.addEventListener(MODE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(MODE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerMode(): PaletteMode {
  return "light";
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore uses the light server snapshot during hydration and
  // then safely applies the browser preference without a theme mismatch.
  const mode = useSyncExternalStore(subscribeToMode, getStoredMode, getServerMode);

  useEffect(() => {
    document.documentElement.dataset.colorMode = mode;
  }, [mode]);

  const setMode = (nextMode: PaletteMode) => {
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    window.dispatchEvent(new Event(MODE_EVENT));
  };

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () =>
        setMode(mode === "light" ? "dark" : "light"),
    }),
    [mode],
  );

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const value = useContext(ThemeModeContext);

  if (!value) {
    throw new Error("useThemeMode debe usarse dentro de ThemeModeProvider.");
  }

  return value;
}
