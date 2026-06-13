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
    <Card sx={{ height: "100%", backgroundColor: "background.paper" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          <Box sx={{ color: "primary.main", display: "inline-flex" }}>{icon}</Box>
          <Typography variant="overline" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {helper}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
