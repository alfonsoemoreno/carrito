import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function AdminPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, md: 3.5 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          maxWidth: 760,
        }}
      >
        {eyebrow ? (
          <Typography variant="overline" color="primary.main">
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h3">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
      {children}
    </Box>
  );
}
