"use client";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
  Box,
  Button,
  Collapse,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useThemeMode } from "@/components/providers/theme-mode-provider";

export type AppShellSection = {
  label: string;
  href?: string;
  items?: ReadonlyArray<{
    href: string;
    label: string;
    description: string;
  }>;
};

type AppShellHeaderProps = {
  brandTitle: string;
  brandSubtitle: string;
  homeHref: string;
  publicUser?: {
    firstName: string;
    lastName: string;
  } | null;
  sections: ReadonlyArray<AppShellSection>;
};

function isDropdownSection(
  section: AppShellSection,
): section is AppShellSection & {
  items: NonNullable<AppShellSection["items"]>;
} {
  return Array.isArray(section.items) && section.items.length > 0;
}

function splitIntoColumns<T>(items: readonly T[]) {
  const columns = items.length >= 8 ? 3 : items.length >= 4 ? 2 : 1;
  const perColumn = Math.ceil(items.length / columns);
  return Array.from({ length: columns }, (_, index) =>
    items.slice(index * perColumn, index * perColumn + perColumn),
  ).filter((column) => column.length > 0);
}

function DesktopDropdownPanel({
  label,
  items,
  pointerOffset,
  onClose,
  panelRef,
}: {
  label: string;
  items: ReadonlyArray<{ href: string; label: string; description: string }>;
  pointerOffset: number;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const columns = splitIntoColumns(items);
  const panelInset = 28;
  const handleNavigate = (href: string) => {
    window.location.assign(href);
  };

  return (
    <Box
      ref={panelRef}
      sx={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      <Container maxWidth="lg">
        <Box
          style={{
            marginLeft: `${panelInset}px`,
            marginRight: `${panelInset}px`,
          }}
          sx={{
            position: "relative",
            backgroundColor: "#ffffff",
            border: "1px solid #d7dbe2",
            borderTop: "none",
            boxShadow: "0 24px 54px rgba(15, 22, 36, 0.18)",
            overflow: "visible",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -9,
              left: `${Math.max(panelInset + 18, pointerOffset - panelInset)}px`,
              width: 18,
              height: 18,
              backgroundColor: "#ffffff",
              borderLeft: "1px solid #d7dbe2",
              borderTop: "1px solid #d7dbe2",
              transform: "translateX(-50%) rotate(45deg)",
            }}
          />

          <IconButton
            aria-label={`Cerrar menú ${label}`}
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 20,
              right: 22,
              color: "#5f6670",
            }}
          >
            <CloseRoundedIcon />
          </IconButton>

          <Box
            style={{
              paddingLeft: "60px",
              paddingRight: "60px",
              paddingTop: "36px",
              paddingBottom: "48px",
            }}
            sx={{
              paddingLeft: { lg: "68px" },
              paddingRight: { lg: "68px" },
            }}
          >
            <Typography
              sx={{
                color: "var(--app-accent)",
                fontSize: "1.9rem",
                lineHeight: 1.1,
                fontWeight: 500,
                mb: 3,
              }}
            >
              {label}
            </Typography>

            <Divider
              sx={{
                borderColor: "#dde2e8",
                mb: 4.5,
                marginLeft: "12px",
                marginRight: "12px",
              }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                columnGap: 7,
                rowGap: 3,
                paddingLeft: "12px",
                paddingRight: "12px",
              }}
            >
              {columns.map((column, index) => (
                <Stack key={`${label}-${index}`} spacing={2.2}>
                  {column.map((item) => (
                    <Box
                      key={item.href}
                      component="button"
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      sx={{
                        border: 0,
                        width: "100%",
                        textAlign: "left",
                        background: "transparent",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <Box
                        style={{
                          paddingLeft: "21px",
                          paddingRight: "21px",
                          paddingTop: "14px",
                          paddingBottom: "14px",
                        }}
                        sx={{
                          borderRadius: "2px",
                          "&:hover": {
                            backgroundColor: "#f5f7fb",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            color: "var(--app-accent)",
                            fontSize: "1.1rem",
                            fontWeight: 500,
                            lineHeight: 1.35,
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.35,
                            color: "#6c7682",
                            fontSize: "0.95rem",
                          }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function MobileMenu({
  sections,
  onNavigate,
  pathname,
}: {
  sections: ReadonlyArray<AppShellSection>;
  onNavigate: () => void;
  pathname: string;
}) {
  const isActiveHref = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Box
      style={{
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingBottom: "12px",
      }}
      sx={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        zIndex: 60,
        backgroundColor: "rgba(255,255,255,0.98)",
        borderTop: "1px solid #d7dbe2",
        borderBottom: "1px solid #d7dbe2",
        boxShadow: "0 16px 40px rgba(15, 22, 36, 0.18)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Container maxWidth="lg" sx={{ px: "0 !important" }}>
        <Stack spacing={1.5} sx={{ py: 2.25 }}>
          {sections.map((section) => (
            <Box
              key={section.label}
              sx={{
                border: "1px solid #dde2e8",
                borderRadius: "10px",
                backgroundColor: "#ffffff",
                overflow: "hidden",
              }}
            >
              {section.href ? (
                <Link href={section.href as never} onClick={onNavigate}>
                  <Typography
                    sx={{
                      display: "block",
                      px: 2.5,
                      py: 2,
                      fontWeight: 700,
                      color: isActiveHref(section.href)
                        ? "var(--app-accent-deep)"
                        : "#1d1d1d",
                      fontSize: "1rem",
                      backgroundColor: isActiveHref(section.href)
                        ? "rgba(74, 109, 167, 0.08)"
                        : "transparent",
                    }}
                  >
                    {section.label}
                  </Typography>
                </Link>
              ) : null}

              {isDropdownSection(section) ? (
                <Box sx={{ p: 1.25 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: "#495463",
                      fontSize: "0.78rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      px: 1.25,
                      pt: 0.5,
                      pb: 1,
                    }}
                  >
                    {section.label}
                  </Typography>
                  <Stack spacing={1}>
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href as never}
                        onClick={onNavigate}
                      >
                        <Box
                          sx={{
                            px: 1.25,
                            py: 1.4,
                            borderRadius: "8px",
                            backgroundColor: isActiveHref(item.href)
                              ? "rgba(74, 109, 167, 0.1)"
                              : "#f7f9fc",
                            border: isActiveHref(item.href)
                              ? "1px solid rgba(74, 109, 167, 0.22)"
                              : "1px solid transparent",
                          }}
                        >
                          <Typography
                            sx={{
                              color: isActiveHref(item.href)
                                ? "var(--app-accent-deep)"
                                : "var(--app-accent)",
                              fontWeight: 700,
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            sx={{
                              color: "#6c7682",
                              fontSize: "0.94rem",
                              mt: 0.45,
                              lineHeight: 1.5,
                            }}
                          >
                            {item.description}
                          </Typography>
                        </Box>
                      </Link>
                    ))}
                  </Stack>
                </Box>
              ) : null}
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

export function AppShellHeader({
  brandTitle,
  brandSubtitle,
  homeHref,
  publicUser,
  sections,
}: AppShellHeaderProps) {
  const pathname = usePathname();
  const { mode, toggleMode } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpenLabel, setDesktopOpenLabel] = useState<string | null>(null);
  const [desktopPointerOffset, setDesktopPointerOffset] = useState(0);
  const [publicUserAnchor, setPublicUserAnchor] = useState<HTMLElement | null>(
    null,
  );
  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const desktopPanelRef = useRef<HTMLDivElement | null>(null);
  const desktopButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );

  const closeAll = () => {
    setMobileOpen(false);
    setDesktopOpenLabel(null);
  };

  const isActiveHref = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const isSectionActive = (section: AppShellSection) => {
    if (section.href) {
      return isActiveHref(section.href);
    }
    return section.items?.some((item) => isActiveHref(item.href)) ?? false;
  };
  const hasSections = sections.length > 0;
  const showPublicUserMenu = !hasSections && pathname !== "/" && !!publicUser;
  const themeToggleButton = (
    <Button
      variant="outlined"
      aria-label={
        mode === "light" ? "Activar modo oscuro" : "Activar modo claro"
      }
      onClick={toggleMode}
      sx={{
        minWidth: 0,
        height: 44,
        px: 1.4,
        gap: 0.9,
        borderColor: "var(--app-form-border)",
        color: "var(--app-accent-deep)",
        backgroundColor: "var(--app-surface)",
      }}
    >
      {mode === "light" ? (
        <DarkModeRoundedIcon fontSize="small" />
      ) : (
        <LightModeRoundedIcon fontSize="small" />
      )}
      <Typography
        sx={{
          fontSize: "0.84rem",
          fontWeight: 700,
          letterSpacing: "0.02em",
          display: { xs: "none", sm: "block" },
        }}
      >
        {mode === "light" ? "Oscuro" : "Claro"}
      </Typography>
    </Button>
  );

  const desktopOpenSection = sections.find(
    (
      section,
    ): section is AppShellSection & {
      items: NonNullable<AppShellSection["items"]>;
    } => section.label === desktopOpenLabel && isDropdownSection(section),
  );

  useEffect(() => {
    if (!desktopOpenLabel) {
      return;
    }

    const syncPointer = () => {
      const nav = desktopNavRef.current;
      const button = desktopButtonRefs.current[desktopOpenLabel];

      if (!nav || !button) {
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const nextOffset = buttonRect.left - navRect.left + buttonRect.width / 2;
      setDesktopPointerOffset(nextOffset);
    };

    syncPointer();
    window.addEventListener("resize", syncPointer);

    return () => {
      window.removeEventListener("resize", syncPointer);
    };
  }, [desktopOpenLabel]);

  useEffect(() => {
    if (!desktopOpenLabel) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const nav = desktopNavRef.current;
      const panel = desktopPanelRef.current;

      if (
        nav?.contains(event.target as Node) ||
        panel?.contains(event.target as Node)
      ) {
        return;
      }

      setDesktopOpenLabel(null);
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [desktopOpenLabel]);

  return (
    <Box component="header" sx={{ position: "relative", zIndex: 30 }}>
      <Box
        sx={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #d8dce2",
        }}
      >
        <Container
          maxWidth={hasSections ? "lg" : false}
          sx={
            hasSections
              ? undefined
              : {
                  px: { xs: 2, sm: 3, md: 4, lg: 6 },
                }
          }
        >
          <Box
            sx={{
              minHeight: { xs: 72, md: 74 },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2.5,
              py: { xs: 1.4, md: 0.8 },
            }}
          >
            <Link href={homeHref as never}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  minWidth: 0,
                  columnGap: "8px",
                }}
              >
                <Box className="app-brand-mark">
                  <Box
                    component="img"
                    src="/icons/app-icon-192.png"
                    alt={`${brandTitle} logo`}
                    sx={{
                      width: { xs: 40, md: 36, lg: 40 },
                      height: { xs: 40, md: 36, lg: 40 },
                      display: "block",
                      borderRadius: "11px",
                      boxShadow:
                        "0 10px 24px rgba(19, 33, 63, 0.12), 0 1px 0 rgba(255,255,255,0.85) inset",
                      backgroundColor: "#ffffff",
                    }}
                  />
                </Box>
                <Box style={{ marginLeft: "0px" }} sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: "#3f3f3f",
                      fontSize: { xs: "1.3rem", md: "1.14rem", lg: "1.34rem" },
                      lineHeight: 1.08,
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {brandTitle}
                  </Typography>
                  <Typography
                    sx={{
                      color: "#666a70",
                      fontSize: "0.82rem",
                      lineHeight: 1.2,
                      mt: 0.2,
                      display: { xs: "none", md: "block" },
                    }}
                  >
                    {brandSubtitle}
                  </Typography>
                </Box>
              </Box>
            </Link>

            {hasSections ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {themeToggleButton}
                <IconButton
                  aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
                  onClick={() => setMobileOpen((current) => !current)}
                  sx={{
                    display: { xs: "inline-flex", md: "none" },
                    color: "#4b4f55",
                    border: "1px solid #cfd4dc",
                    borderRadius: 0,
                  }}
                >
                  {mobileOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
                </IconButton>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {themeToggleButton}
                <Link href={homeHref as never}>
                  <Button
                    variant="outlined"
                    aria-label="Ir al inicio"
                    sx={{ minWidth: 0, width: 44, height: 44, px: 0 }}
                  >
                    <HomeRoundedIcon fontSize="small" />
                  </Button>
                </Link>
                {showPublicUserMenu ? (
                  <>
                    <Button
                      variant="outlined"
                      aria-label="Abrir menú de usuario"
                      onClick={(event) =>
                        setPublicUserAnchor(event.currentTarget)
                      }
                      sx={{ minWidth: 0, width: 44, height: 44, px: 0 }}
                    >
                      <AccountCircleRoundedIcon fontSize="small" />
                    </Button>
                    <Menu
                      anchorEl={publicUserAnchor}
                      open={Boolean(publicUserAnchor)}
                      onClose={() => setPublicUserAnchor(null)}
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      transformOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                      <MenuItem disabled>
                        {publicUser?.firstName} {publicUser?.lastName}
                      </MenuItem>
                      <Box
                        component="form"
                        action="/public/logout"
                        method="post"
                      >
                        <MenuItem component="button" type="submit">
                          Cerrar sesión
                        </MenuItem>
                      </Box>
                    </Menu>
                  </>
                ) : null}
              </Stack>
            )}
          </Box>
        </Container>
      </Box>

      {hasSections ? (
        <Box
          sx={{
            position: "relative",
            backgroundColor: "var(--app-nav)",
            boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <Container maxWidth="lg">
            <Box
              ref={desktopNavRef}
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "stretch",
                minHeight: 58,
                position: "relative",
              }}
            >
              {sections.map((section, index) => {
                const active =
                  isSectionActive(section) ||
                  (desktopOpenLabel !== null &&
                    desktopOpenLabel === section.label);

                if (section.href) {
                  return (
                    <Link key={section.label} href={section.href as never}>
                      <Box
                        style={{
                          paddingLeft: "22px",
                          paddingRight: "22px",
                          marginLeft: index === 0 ? "0px" : "8px",
                        }}
                        sx={{
                          height: 58,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1.1,
                          flexWrap: "nowrap",
                          color: "#ffffff",
                          backgroundColor: active ? "#353535" : "transparent",
                          "& .MuiTypography-root, & .MuiSvgIcon-root": {
                            color: "#ffffff",
                          },
                          "&:hover": {
                            backgroundColor: "#343434",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "1rem",
                            letterSpacing: "0.02em",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            lineHeight: 1.1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {section.label}
                        </Typography>
                      </Box>
                    </Link>
                  );
                }

                if (!isDropdownSection(section)) {
                  return null;
                }

                return (
                  <Box
                    key={section.label}
                    sx={{
                      display: "flex",
                    }}
                  >
                    <Box
                      component="button"
                      type="button"
                      ref={(node: HTMLButtonElement | null) => {
                        desktopButtonRefs.current[section.label] = node;
                      }}
                      onClick={() =>
                        setDesktopOpenLabel((current) =>
                          current === section.label ? null : section.label,
                        )
                      }
                      style={{
                        paddingLeft: "24px",
                        paddingRight: "24px",
                        marginLeft: index === 0 ? "0px" : "8px",
                      }}
                      sx={{
                        height: 58,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.05,
                        flexWrap: "nowrap",
                        cursor: "pointer",
                        color: "#ffffff",
                        border: 0,
                        outline: 0,
                        backgroundColor: active ? "#353535" : "transparent",
                        "& .MuiTypography-root, & .MuiSvgIcon-root": {
                          color: "#ffffff",
                        },
                        "& .MuiSvgIcon-root": {
                          flexShrink: 0,
                        },
                        "&:hover": {
                          backgroundColor: "#343434",
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "1rem",
                          letterSpacing: "0.02em",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          lineHeight: 1.1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {section.label}
                      </Typography>
                      <ExpandMoreRoundedIcon
                        sx={{
                          fontSize: 19,
                          transform:
                            desktopOpenLabel === section.label
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          transition: "transform 160ms ease",
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Container>

          {desktopOpenSection ? (
            <DesktopDropdownPanel
              label={desktopOpenSection.label}
              items={desktopOpenSection.items}
              pointerOffset={desktopPointerOffset}
              onClose={() => setDesktopOpenLabel(null)}
              panelRef={desktopPanelRef}
            />
          ) : null}

          <Box
            style={{
              paddingLeft: "16px",
              paddingRight: "16px",
              paddingTop: "10px",
              paddingBottom: "10px",
            }}
            sx={{
              display: { xs: "flex", md: "none" },
              px: 0,
              py: 0,
            }}
          >
            <Box
              component="button"
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation-menu"
              aria-label={mobileOpen ? "Cerrar navegación" : "Abrir navegación"}
              onClick={() => setMobileOpen((current) => !current)}
              style={{
                width: "100%",
                minHeight: "54px",
                paddingLeft: "22px",
                paddingRight: "22px",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "10px",
                color: "#ffffff",
                background: mobileOpen
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.04)",
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition:
                  "background-color 180ms ease, border-color 180ms ease, transform 180ms ease",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.2)",
                },
              }}
            >
              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: "0.93rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  pl: 0.9,
                }}
              >
                Navegación
              </Typography>
              <ExpandMoreRoundedIcon
                sx={{
                  color: "#ffffff",
                  fontSize: 22,
                  mr: 0.25,
                  transform: mobileOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              />
            </Box>
          </Box>

          <Collapse
            in={mobileOpen}
            timeout={220}
            unmountOnExit
            easing={{
              enter: "cubic-bezier(0.2, 0.8, 0.2, 1)",
              exit: "cubic-bezier(0.4, 0, 1, 1)",
            }}
          >
            <Box
              id="mobile-navigation-menu"
              sx={{
                transformOrigin: "top center",
                animation: mobileOpen
                  ? "mobileMenuFadeIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1)"
                  : "none",
              }}
            >
              <MobileMenu
                sections={sections}
                onNavigate={closeAll}
                pathname={pathname}
              />
            </Box>
          </Collapse>
        </Box>
      ) : null}
    </Box>
  );
}
