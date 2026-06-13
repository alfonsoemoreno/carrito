import { Box, Card, CardContent, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function AdminStatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider", height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ color: "primary.main" }}>{icon}</Box>
          <Typography variant="overline" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4">{value}</Typography>
          <Typography variant="body2" color="text.secondary">
            {helper}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
