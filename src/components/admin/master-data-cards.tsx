import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

export function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider", height: "100%" }}>
      <CardHeader title={title} subheader={description} />
      <Divider />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SubmitButton({ label }: { label: string }) {
  return (
    <Button type="submit" variant="contained">
      {label}
    </Button>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

export function SwitchField({
  name,
  label,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Switch name={name} defaultChecked={defaultChecked} />
      <Typography variant="body2">{label}</Typography>
    </Box>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        border: "1px dashed",
        borderColor: "divider",
        p: 3,
      }}
    >
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary">{body}</Typography>
    </Box>
  );
}

export function ModuleLinkCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <Card sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider", height: "100%" }}>
      <CardContent>
        <Stack spacing={2}>
          <Chip label={badge} size="small" color="primary" sx={{ alignSelf: "flex-start" }} />
          <Typography variant="h5">{title}</Typography>
          <Typography color="text.secondary">{description}</Typography>
          <a href={href}>
            <Button variant="outlined">Abrir modulo</Button>
          </a>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  options: Array<{ value: string | number; label: string }>;
}) {
  return (
    <TextField select fullWidth name={name} label={label} defaultValue={defaultValue}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
