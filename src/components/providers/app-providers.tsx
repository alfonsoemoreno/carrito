"use client";

import { authClient } from "@/lib/auth/client";
import theme from "@/theme/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NeonAuthUIProvider authClient={authClient} redirectTo="/admin">
          {children}
        </NeonAuthUIProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
