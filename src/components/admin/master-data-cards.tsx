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
  TextField,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import Link from "next/link";
import { ActionSubmitButton } from "@/components/feedback/action-submit-button";

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
    <ActionSubmitButton
      variant="contained"
      sx={{ alignSelf: "flex-start", minWidth: 200, px: 3 }}
      loadingMessage="Estamos guardando los cambios."
    >
      {label}
    </ActionSubmitButton>
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 1,
        minHeight: 72,
        px: 2,
        py: 1.5,
        border: "1px solid",
        borderColor: "var(--app-form-border)",
        borderRadius: "14px",
        backgroundColor: "var(--app-form-fill)",
        boxShadow: "none",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "var(--app-form-label)",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        Ajuste
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          width: "100%",
        }}
      >
        <Box>
          <Typography
            variant="body2"
            sx={{ color: "var(--app-ink)", fontWeight: 700 }}
          >
            {label}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--app-form-muted)" }}>
            Activa o desactiva este comportamiento.
          </Typography>
        </Box>
        <Box
          component="label"
          sx={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <Box
            component="input"
            type="checkbox"
            name={name}
            defaultChecked={defaultChecked}
            aria-label={label}
            sx={{
              position: "absolute",
              width: 1,
              height: 1,
              p: 0,
              m: -1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
              whiteSpace: "nowrap",
              border: 0,
              "&:focus-visible + .switch-track": {
                outline: "3px solid rgba(74, 109, 167, 0.28)",
                outlineOffset: 2,
              },
              "&:checked + .switch-track": {
                backgroundColor: "var(--app-accent)",
                borderColor: "var(--app-accent)",
              },
              "&:checked + .switch-track .switch-thumb": {
                transform: "translateX(20px)",
              },
            }}
          />
          <Box
            className="switch-track"
            sx={{
              width: 48,
              height: 28,
              borderRadius: 999,
              border: "1px solid var(--app-form-border)",
              backgroundColor: "var(--app-form-border-strong)",
              p: "2px",
              display: "flex",
              alignItems: "center",
              boxSizing: "border-box",
              transition:
                "background-color 160ms ease, border-color 160ms ease",
            }}
          >
            <Box
              className="switch-thumb"
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "var(--app-surface)",
                boxShadow: "0 2px 6px rgba(17, 17, 17, 0.24)",
                transition: "transform 160ms ease",
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        border: "1px dashed",
        borderColor: "divider",
        p: { xs: 3, md: 4 },
        backgroundColor: "background.paper",
        textAlign: "center",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 650 }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }}>{body}</Typography>
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
    <Card
      sx={{
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(60, 64, 67, 0.12)" },
        height: "100%",
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Chip
            label={badge}
            size="small"
            variant="outlined"
            sx={{ alignSelf: "flex-start", color: "primary.main", borderColor: "rgba(11, 87, 208, 0.28)", backgroundColor: "rgba(11, 87, 208, 0.06)" }}
          />
          <Typography variant="h5">{title}</Typography>
          <Typography color="text.secondary">{description}</Typography>
        <Link href={href as never} style={{ alignSelf: "flex-start" }}>
            <Button variant="text" sx={{ px: 1 }}>Abrir módulo</Button>
          </Link>
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
    <TextField
      select
      name={name}
      label={label}
      defaultValue={defaultValue ?? ""}
      fullWidth
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
