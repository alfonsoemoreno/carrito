"use client";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Box,
  Button,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const sections = [
  { label: "Inicio", href: "/" },
  {
    label: "Servicios",
    items: [
      {
        href: "/solicitar",
        label: "Solicitar turnos",
        description: "Revise disponibilidad y envíe solicitudes.",
      },
      {
        href: "/asignaciones",
        label: "Asignaciones",
        description: "Consulte asignaciones visibles e historial.",
      },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        href: "/admin",
        label: "Panel administrativo",
        description: "Entre al panel de gestión y reportes.",
      },
      {
        href: "/auth/sign-in",
        label: "Iniciar sesión",
        description: "Acceso de coordinadores y encargados.",
      },
    ],
  },
] as const;

function DropdownPanel({
  items,
  onNavigate,
}: {
  items: ReadonlyArray<{ href: string; label: string; description: string }>;
  onNavigate?: () => void;
}) {
  return (
    <Box
      sx={{
        minWidth: { xs: "100%", md: 340 },
        backgroundColor: "#ffffff",
        color: "#1a1a1a",
        border: "1px solid #cfd4dc",
        boxShadow: "0 18px 38px rgba(0,0,0,0.16)",
        borderRadius: "0 0 4px 4px",
        overflow: "hidden",
      }}
    >
      {items.map((item, index) => (
        <Box key={item.href}>
          {index > 0 ? <Divider /> : null}
          <Link href={item.href as never} style={{ color: "inherit" }} onClick={onNavigate}>
            <Box
              sx={{
                px: 2.5,
                py: 2,
                "&:hover": {
                  backgroundColor: "#f5f7fa",
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.4 }}>
                {item.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
            </Box>
          </Link>
        </Box>
      ))}
    </Box>
  );
}

export function PublicNav() {
  const pathname = usePathname();
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null);
  const desktopSection =
    desktopOpen
      ? sections.find(
          (section): section is Extract<(typeof sections)[number], { items: readonly { href: string; label: string; description: string }[] }> =>
            "items" in section && section.label === desktopOpen,
        ) ?? null
      : null;

  const isActiveHref = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const isSectionActive = (section: (typeof sections)[number]) => {
    if ("href" in section) {
      return isActiveHref(section.href);
    }
    return section.items.some((item) => isActiveHref(item.href));
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "stretch",
          minHeight: 58,
        }}
      >
        {sections.map((section) => {
          const active = isSectionActive(section);

          if ("href" in section) {
            return (
              <Link key={section.label} href={section.href} style={{ color: "inherit" }}>
                <Box
                  sx={{
                    px: 2.5,
                    py: 2,
                    minHeight: 58,
                    display: "flex",
                    alignItems: "center",
                    borderBottom: active ? "3px solid #6e8ecb" : "3px solid transparent",
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                    color: active ? "#ffffff" : "rgba(255,255,255,0.94)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      fontSize: "0.82rem",
                    }}
                  >
                    {section.label}
                  </Typography>
                </Box>
              </Link>
            );
          }

          const isOpen = desktopOpen === section.label;

          return (
            <Box
              key={section.label}
              sx={{ position: "relative" }}
              onMouseLeave={() => setDesktopOpen(null)}
            >
              <Button
                onMouseEnter={() => setDesktopOpen(section.label)}
                onClick={() => setDesktopOpen(isOpen ? null : section.label)}
                endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  px: 2.5,
                  py: 2,
                  minHeight: 58,
                  borderRadius: "0 !important",
                  borderBottom: active || isOpen ? "3px solid #6e8ecb" : "3px solid transparent",
                  borderRight: "1px solid rgba(255,255,255,0.08)",
                  color: active || isOpen ? "#ffffff !important" : "rgba(255,255,255,0.94) !important",
                  backgroundColor: isOpen ? "rgba(255,255,255,0.05) !important" : "transparent !important",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.05) !important",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontSize: "0.82rem",
                  }}
                >
                  {section.label}
                </Typography>
              </Button>
            </Box>
          );
        })}
      </Box>

      {desktopOpen ? (
        <Box sx={{ display: { xs: "none", md: "block" }, pt: 0 }}>
          <DropdownPanel
            items={desktopSection?.items ?? []}
            onNavigate={() => setDesktopOpen(null)}
          />
        </Box>
      ) : null}

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Box
          sx={{
            mt: 1,
            backgroundColor: "#ffffff",
              color: "#1a1a1a",
              border: "1px solid #cfd4dc",
              borderRadius: 1,
              overflow: "hidden",
            boxShadow: "0 18px 38px rgba(0,0,0,0.14)",
          }}
        >
          {sections.map((section, index) => (
            <Box key={section.label}>
              {index > 0 ? <Divider /> : null}
              {"href" in section ? (
                  <Link href={section.href as never} style={{ color: "#1a1a1a" }}>
                  <Box sx={{ px: 2.25, py: 1.6 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {section.label}
                    </Typography>
                  </Box>
                </Link>
              ) : (
                <Box sx={{ px: 2.25, py: 1.6 }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.9 }}
                  >
                    {section.label}
                  </Typography>
                  <Stack spacing={1.2}>
                    {section.items.map((item) => (
                      <Link key={item.href} href={item.href as never} style={{ color: "#1a1a1a" }}>
                        <Box sx={{ py: 0.35 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.2 }}>
                            {item.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Box>
                      </Link>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
