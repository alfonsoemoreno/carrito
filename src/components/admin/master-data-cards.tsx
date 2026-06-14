import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title={title}
        subheader={description}
        slotProps={{
          title: {
            variant: "h5",
          },
          subheader: {
            sx: {
              color: "text.secondary",
              lineHeight: 1.55,
              mt: 0.75,
            },
          },
        }}
      />
      <Divider />
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>{children}</CardContent>
    </Card>
  );
}

export function SubmitButton({ label }: { label: string }) {
  return (
    <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start", minWidth: 200, px: 3 }}>
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
        gap: 3,
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
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minHeight: 52 }}>
      <Switch name={name} defaultChecked={defaultChecked} />
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
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
        borderRadius: 1,
        border: "1px dashed",
        borderColor: "divider",
        p: 3,
        backgroundColor: "rgba(255,255,255,0.55)",
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
    <Card sx={{ borderRadius: 1, border: "1px solid", borderColor: "divider", height: "100%" }}>
      <CardContent>
        <Stack spacing={2}>
          <Chip label={badge} size="small" color="primary" sx={{ alignSelf: "flex-start" }} />
          <Typography variant="h5">{title}</Typography>
          <Typography color="text.secondary">{description}</Typography>
          <a href={href}>
            <Button variant="outlined">Abrir módulo</Button>
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
    <FormControl fullWidth>
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-label`}
        name={name}
        label={label}
        defaultValue={defaultValue ?? ""}
      >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
      </Select>
    </FormControl>
  );
}
