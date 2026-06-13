import { Box, Chip, Typography } from "@mui/material";
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Chip
          label={eyebrow}
          color="primary"
          size="small"
          sx={{ alignSelf: "flex-start", fontWeight: 700 }}
        />
        <Typography variant="h3">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
      {children}
    </Box>
  );
}
