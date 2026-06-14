import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { AppShellHeader } from "@/components/navigation/app-shell-header";
import { getCurrentPublicPerson } from "@/features/public/queries";

export async function PublicSiteShell({ children }: { children: ReactNode }) {
  const congregationName = process.env.CONGREGATION_NAME ?? "Sin configurar";
  const currentPerson = await getCurrentPublicPerson();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppShellHeader
        brandTitle="Predicación pública"
        brandSubtitle={`Congregación ${congregationName}`}
        homeHref="/"
        publicUser={
          currentPerson
            ? {
                firstName: currentPerson.firstName,
                lastName: currentPerson.lastName,
              }
            : null
        }
        sections={[]}
      />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          "& > main": {
            flex: 1,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
