"use client";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EVENT_BRAND } from "@/theme/event-theme";
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
  const columns = items.length >= 10 ? 3 : items.length >= 4 ? 2 : 1;
  const perColumn = Math.ceil(items.length / columns);
  return Array.from({ length: columns }, (_, index) =>
    items.slice(index * perColumn, index * perColumn + perColumn),
  ).filter((column) => column.length > 0);
}

function DesktopDropdownPanel({
  label,
  items,
  onClose,
  panelRef,
}: {
  label: string;
  items: ReadonlyArray<{ href: string; label: string; description: string }>;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const columns = splitIntoColumns(items);
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
        zIndex: 50,
      }}
    >
      <Container maxWidth="lg" sx={{ mx: 0, px: "0 !important" }}>
        <Box
          sx={{
            position: "relative",
            backgroundColor: "var(--app-surface)",
            border: "1px solid var(--app-border)",
            borderRadius: 0,
            boxShadow: "0 12px 28px rgba(31, 41, 55, 0.14)",
            width: { md: 620, lg: 720 },
            maxWidth: "calc(100vw - 32px)",
            overflow: "hidden",
          }}
        >
          <IconButton
            aria-label={`Cerrar menú ${label}`}
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 14,
              right: 16,
              color: "var(--app-muted)",
            }}
          >
            <CloseRoundedIcon />
          </IconButton>

          <Box
            style={{
              paddingLeft: "32px",
              paddingRight: "32px",
              paddingTop: "28px",
              paddingBottom: "32px",
            }}
            sx={{
              paddingLeft: { lg: "40px" },
              paddingRight: { lg: "40px" },
            }}
          >
            <Typography
              sx={{
                color: "var(--app-accent-deep)",
                fontSize: "1.5rem",
                lineHeight: 1.1,
                fontWeight: 650,
                mb: 2.5,
              }}
            >
              {label}
            </Typography>

            <Divider
              sx={{
                borderColor: "var(--app-border)",
                mb: 2.5,
              }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                columnGap: 3,
                rowGap: 2,
              }}
            >
              {columns.map((column, index) => (
                <Stack key={`${label}-${index}`} spacing={0.75}>
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
                          paddingLeft: "16px",
                          paddingRight: "16px",
                          paddingTop: "12px",
                          paddingBottom: "12px",
                        }}
                        sx={{
                          borderRadius: 0,
                          "&:hover": {
                            backgroundColor: "var(--app-surface-muted)",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            color: "var(--app-accent-deep)",
                            fontSize: "1rem",
                            fontWeight: 650,
                            lineHeight: 1.35,
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.35,
                            color: "var(--app-muted)",
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
  open,
  sections,
  onClose,
  pathname,
  publicUser,
  mode,
  onToggleMode,
}: {
  open: boolean;
  sections: ReadonlyArray<AppShellSection>;
  onClose: () => void;
  pathname: string;
  publicUser?: { firstName: string; lastName: string } | null;
  mode: "light" | "dark";
  onToggleMode: () => void;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const trapTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      ),
    ).filter((element) => element.tabIndex !== -1);
    const first = focusable[0];
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const isActiveHref = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  const requestSection = sections.find((section) => section.href === "/solicitar");
  const primarySections = sections.filter((section) => section !== requestSection);
  const handleClose = () => {
    setExpandedSection(null);
    onClose();
  };

  return (
    <Box
      aria-hidden={!open}
      className={`official-mobile-menu${open ? " is-open" : ""}`}
    >
      <Box
        aria-hidden="true"
        className="official-mobile-menu__scrim"
        component="div"
        onClick={handleClose}
      />
      <Box
        aria-label="Menú principal"
        aria-modal={open || undefined}
        className="official-mobile-menu__panel"
        id="mobile-navigation-menu"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={trapTabKey}
        role="dialog"
      >
        <Box
          aria-label="Cerrar menú"
          className="official-mobile-menu__close"
          component="button"
          id="mobile-navigation-close"
          onClick={handleClose}
          tabIndex={open ? 0 : -1}
          type="button"
        >
          <CloseRoundedIcon aria-hidden="true" />
        </Box>

        <Box className="official-mobile-menu__content">
          <Box component="nav" aria-label="Navegación principal">
            {primarySections.map((section) =>
              section.href ? (
                <Link
                  aria-current={isActiveHref(section.href) ? "page" : undefined}
                  className={`official-mobile-menu__row${isActiveHref(section.href) ? " is-active" : ""}`}
                  href={section.href as never}
                  key={section.href}
                  onClick={handleClose}
                  tabIndex={open ? 0 : -1}
                >
                  {section.label}
                </Link>
              ) : isDropdownSection(section) ? (
                <Box className="official-mobile-menu__group" key={section.label}>
                  <Box
                    aria-controls={`mobile-submenu-${section.label.replace(/\W+/g, "-").toLowerCase()}`}
                    aria-expanded={expandedSection === section.label}
                    className="official-mobile-menu__row official-mobile-menu__group-button"
                    component="button"
                    onClick={() =>
                      setExpandedSection((current) =>
                        current === section.label ? null : section.label,
                      )
                    }
                    type="button"
                  >
                    {section.label}
                    <ExpandMoreRoundedIcon
                      aria-hidden="true"
                      className={expandedSection === section.label ? "is-expanded" : ""}
                    />
                  </Box>
                  {expandedSection === section.label ? (
                    <Box
                      className="official-mobile-menu__submenu"
                      id={`mobile-submenu-${section.label.replace(/\W+/g, "-").toLowerCase()}`}
                    >
                      {section.items.map((item) => (
                        <Link
                          aria-current={isActiveHref(item.href) ? "page" : undefined}
                          className={isActiveHref(item.href) ? "is-active" : ""}
                          href={item.href as never}
                          key={item.href}
                          onClick={handleClose}
                          tabIndex={open ? 0 : -1}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </Box>
                  ) : null}
                </Box>
              ) : null,
            )}
          </Box>

          {requestSection?.href ? (
            <Box component="nav" aria-label="Acción principal">
              <Link
                aria-current={isActiveHref(requestSection.href) ? "page" : undefined}
                className="official-mobile-menu__cta"
                href={requestSection.href as never}
                onClick={handleClose}
                tabIndex={open ? 0 : -1}
              >
                {requestSection.label}
              </Link>
            </Box>
          ) : null}
        </Box>

        <Box className="official-mobile-menu__utilities">
          {publicUser ? (
            <Box className="official-mobile-menu__account">
              <Typography component="span" className="official-mobile-menu__account-name">
                {publicUser.firstName} {publicUser.lastName}
              </Typography>
              <Box
                action="/public/logout"
                component="form"
                data-suppress-global-feedback="true"
                method="post"
                onSubmit={() => window.dispatchEvent(new Event("public-session-ending"))}
              >
                <Box
                  className="official-mobile-menu__utility-link"
                  component="button"
                  onClick={handleClose}
                  tabIndex={open ? 0 : -1}
                  type="submit"
                >
                  Cerrar sesión
                </Box>
              </Box>
            </Box>
          ) : null}
          <Box
            aria-label={mode === "light" ? "Activar modo oscuro" : "Activar modo claro"}
            className="official-mobile-menu__utility-link"
            component="button"
            onClick={onToggleMode}
            type="button"
          >
            {mode === "light" ? (
              <DarkModeOutlinedIcon aria-hidden="true" />
            ) : (
              <LightModeOutlinedIcon aria-hidden="true" />
            )}
            {mode === "light" ? "Modo oscuro" : "Modo claro"}
          </Box>
        </Box>
      </Box>
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
  const [publicUserAnchor, setPublicUserAnchor] = useState<HTMLElement | null>(
    null,
  );
  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const desktopPanelRef = useRef<HTMLDivElement | null>(null);

  const closeAll = () => {
    setMobileOpen(false);
    setDesktopOpenLabel(null);
    if (mobileOpen) {
      document.querySelector<HTMLButtonElement>(".app-mobile-menu-toggle")?.focus();
    }
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
  const showPublicUserMenu = pathname !== "/" && !!publicUser;
  const themeToggleButton = (
    <Tooltip title={mode === "light" ? "Activar modo oscuro" : "Activar modo claro"}>
      <IconButton
      aria-label={
        mode === "light" ? "Activar modo oscuro" : "Activar modo claro"
      }
      onClick={toggleMode}
      sx={{
        width: 40,
        height: 40,
        color: "var(--app-muted)",
        border: "1px solid var(--app-border)",
        backgroundColor: "var(--app-surface)",
      }}
    >
      {mode === "light" ? (
        <DarkModeOutlinedIcon fontSize="small" />
      ) : (
        <LightModeOutlinedIcon fontSize="small" />
      )}
      </IconButton>
    </Tooltip>
  );

  const desktopOpenSection = sections.find(
    (
      section,
    ): section is AppShellSection & {
      items: NonNullable<AppShellSection["items"]>;
    } => section.label === desktopOpenLabel && isDropdownSection(section),
  );

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setDesktopOpenLabel(null);
        document.querySelector<HTMLButtonElement>(".app-mobile-menu-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

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
    <Box component="header" sx={{ position: { xs: "sticky", lg: "relative" }, top: 0, zIndex: 30 }}>
      <Box
        sx={{
          backgroundColor: "var(--app-header)",
          borderBottom: "1px solid var(--app-border)",
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
              minHeight: { xs: hasSections ? 70 : 72, md: 74 },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2.5,
              py: { xs: hasSections ? 0 : 1.4, md: 0.8 },
            }}
          >
            <Link href={homeHref as never}>
              <Box
                aria-label={`${brandTitle} · ${brandSubtitle}`}
                className="app-brand-lockup"
                component="span"
                sx={{
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  minWidth: 0,
                }}
              >
                <Box aria-hidden="true" className="app-brand-rule" />
                <Typography component="span" className="app-brand-title">
                  {brandTitle.replace(/\s+Amateur$/i, "")}
                </Typography>
                <Box className="app-brand-detail">
                  <Typography component="span" className="app-brand-category">
                    {EVENT_BRAND.category}
                  </Typography>
                  <Typography
                    component="span"
                    className="app-brand-subtitle"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    {brandSubtitle}
                  </Typography>
                </Box>
              </Box>
            </Link>

            {hasSections ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", display: { xs: "none", lg: "flex" } }}>
                {themeToggleButton}
                {showPublicUserMenu ? (
                  <>
                    <Button
                      variant="outlined"
                      aria-label="Abrir menú de usuario"
                      onClick={(event) => setPublicUserAnchor(event.currentTarget)}
                      sx={{ minWidth: 0, width: 44, height: 44, px: 0 }}
                    >
                      <AccountCircleOutlinedIcon fontSize="small" />
                    </Button>
                    <Menu
                      anchorEl={publicUserAnchor}
                      open={Boolean(publicUserAnchor)}
                      onClose={() => setPublicUserAnchor(null)}
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      transformOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                      <MenuItem disabled sx={{ opacity: "1 !important", color: "text.secondary !important", fontWeight: 650, cursor: "default" }}>
                        {publicUser?.firstName} {publicUser?.lastName}
                      </MenuItem>
                      <Box
                        component="form"
                        action="/public/logout"
                        method="post"
                        data-suppress-global-feedback="true"
                        onSubmit={() => window.dispatchEvent(new Event("public-session-ending"))}
                      >
                        <MenuItem component="button" type="submit">Cerrar sesión</MenuItem>
                      </Box>
                    </Menu>
                  </>
                ) : null}
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {themeToggleButton}
                <Link href={homeHref as never}>
                  <Tooltip title="Ir al inicio">
                    <IconButton
                    aria-label="Ir al inicio"
                    sx={{ width: 40, height: 40, color: "var(--app-muted)", border: "1px solid var(--app-border)" }}
                  >
                    <HomeOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
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
                      <AccountCircleOutlinedIcon fontSize="small" />
                    </Button>
                    <Menu
                      anchorEl={publicUserAnchor}
                      open={Boolean(publicUserAnchor)}
                      onClose={() => setPublicUserAnchor(null)}
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      transformOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                      <MenuItem
                        disabled
                        sx={{
                          opacity: "1 !important",
                          color: "text.secondary !important",
                          fontWeight: 650,
                          cursor: "default",
                        }}
                      >
                        {publicUser?.firstName} {publicUser?.lastName}
                      </MenuItem>
                      <Box
                        component="form"
                        action="/public/logout"
                        method="post"
                        data-suppress-global-feedback="true"
                        onSubmit={() => {
                          window.dispatchEvent(new Event("public-session-ending"));
                        }}
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
            {hasSections ? (
              <Box
                aria-controls="mobile-navigation-menu"
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
                className="app-mobile-menu-toggle"
                component="button"
                onClick={() => {
                  if (mobileOpen) {
                    closeAll();
                    return;
                  }
                  setMobileOpen(true);
                  window.setTimeout(() => {
                    document.getElementById("mobile-navigation-close")?.focus();
                  }, 0);
                }}
                sx={{ display: { xs: "inline-flex", lg: "none" } }}
                type="button"
              >
                <span aria-hidden="true" className="app-mobile-menu-toggle__bars">
                  <span />
                  <span />
                  <span />
                </span>
              </Box>
            ) : null}
          </Box>
        </Container>
      </Box>

      {hasSections ? (
        <Box
          sx={{
            position: "relative",
            backgroundColor: "var(--app-header)",
            borderBottom: "1px solid var(--app-border)",
            boxShadow: "0 1px 2px rgba(60, 64, 67, 0.04)",
            display: { xs: "none", lg: "block" },
          }}
        >
      <Container maxWidth="lg">
            <Box
              ref={desktopNavRef}
              sx={{
                display: { xs: "none", lg: "flex" },
                alignItems: "stretch",
                minHeight: 56,
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
                          height: 56,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1.1,
                          flexWrap: "nowrap",
                          color: "var(--app-muted)",
                          position: "relative",
                          borderRadius: 0,
                          borderBottom: active ? "2px solid var(--app-accent)" : "2px solid transparent",
                          backgroundColor: "transparent",
                          "& .MuiTypography-root, & .MuiSvgIcon-root": {
                            color: active ? "var(--app-accent-deep)" : "var(--app-muted)",
                          },
                          "&:hover": {
                            color: "var(--app-ink)",
                            borderBottomColor: active ? "var(--app-accent)" : "var(--app-border)",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "1rem",
                            letterSpacing: 0,
                            textTransform: "none",
                            fontWeight: 650,
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
                        height: 56,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.05,
                        flexWrap: "nowrap",
                        cursor: "pointer",
                        color: "var(--app-muted)",
                        border: 0,
                        outline: 0,
                        position: "relative",
                        borderRadius: 0,
                        borderBottom: active ? "2px solid var(--app-accent)" : "2px solid transparent",
                        backgroundColor: "transparent",
                        "& .MuiTypography-root, & .MuiSvgIcon-root": {
                          color: active ? "var(--app-accent-deep)" : "var(--app-muted)",
                        },
                        "& .MuiSvgIcon-root": {
                          flexShrink: 0,
                        },
                        "&:hover": {
                          color: "var(--app-ink)",
                          borderBottomColor: active ? "var(--app-accent)" : "var(--app-border)",
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "1rem",
                          letterSpacing: 0,
                          textTransform: "none",
                          fontWeight: 650,
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
              onClose={() => setDesktopOpenLabel(null)}
              panelRef={desktopPanelRef}
            />
          ) : null}

        </Box>
      ) : null}
      {hasSections ? (
        <MobileMenu
          open={mobileOpen}
          sections={sections}
          onClose={closeAll}
          pathname={pathname}
          publicUser={showPublicUserMenu ? publicUser : null}
          mode={mode}
          onToggleMode={toggleMode}
        />
      ) : null}
    </Box>
  );
}
