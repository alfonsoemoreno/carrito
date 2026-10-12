import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { AppShellHeader } from "@/components/navigation/app-shell-header";
import { getCurrentPublicPerson } from "@/features/public/queries";
import { EVENT, EVENT_BRAND_SUBTITLE } from "@/lib/event";

export async function PublicSiteShell({ children }: { children: ReactNode }) {
  const currentPerson = await getCurrentPublicPerson();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppShellHeader
        brandTitle={EVENT.name}
        brandSubtitle={EVENT_BRAND_SUBTITLE}
        homeHref="/"
        publicUser={
          currentPerson
            ? {
                firstName: currentPerson.firstName,
                lastName: currentPerson.lastName,
              }
            : null
        }
        sections={[
          { label: "Inicio", href: "/" },
          { label: "Solicitar turnos", href: "/solicitar" },
          { label: "Mis turnos", href: "/asignaciones" },
        ]}
      />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          "& > main": {
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          },
          "& > main > *": {
            width: "100%",
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
