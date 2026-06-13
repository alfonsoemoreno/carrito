"use client";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Container, Divider, IconButton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type AppShellSection = {
  label: string;
  href?: string;
  items?: ReadonlyArray<{
    href: string;
    label: string;
    description: string;
  }>;
};

type UtilityLink = {
  label: string;
  href: string;
};

type AppShellHeaderProps = {
  brandMark: string;
  brandTitle: string;
  brandSubtitle: string;
  homeHref: string;
  sections: ReadonlyArray<AppShellSection>;
  utilityLinks?: ReadonlyArray<UtilityLink>;
  utilityNote?: string;
  searchPlaceholder?: string;
};

function isDropdownSection(
  section: AppShellSection,
): section is AppShellSection & { items: NonNullable<AppShellSection["items"]> } {
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
                          <Typography sx={{ mt: 0.35, color: "#6c7682", fontSize: "0.95rem" }}>
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
}: {
  sections: ReadonlyArray<AppShellSection>;
  onNavigate: () => void;
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        zIndex: 60,
        backgroundColor: "#ffffff",
        borderTop: "1px solid #d7dbe2",
        borderBottom: "1px solid #d7dbe2",
        boxShadow: "0 16px 40px rgba(15, 22, 36, 0.18)",
      }}
    >
      <Container maxWidth="lg">
        <Stack divider={<Divider sx={{ borderColor: "#dde2e8" }} />}>
          {sections.map((section) => (
            <Box key={section.label} sx={{ py: 2.5 }}>
              {section.href ? (
                <Link href={section.href as never} onClick={onNavigate}>
                  <Typography sx={{ fontWeight: 700, color: "#1d1d1d", fontSize: "1rem" }}>
                    {section.label}
                  </Typography>
                </Link>
              ) : null}

              {isDropdownSection(section) ? (
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: "#1d1d1d",
                      fontSize: "0.9rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1.4,
                    }}
                  >
                    {section.label}
                  </Typography>
                  <Stack spacing={1.5}>
                    {section.items.map((item) => (
                      <Link key={item.href} href={item.href as never} onClick={onNavigate}>
                        <Box sx={{ px: 0.4, py: 0.2 }}>
                          <Typography sx={{ color: "var(--app-accent)", fontWeight: 600 }}>
                            {item.label}
                          </Typography>
                          <Typography sx={{ color: "#6c7682", fontSize: "0.94rem", mt: 0.3 }}>
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
  brandMark,
  brandTitle,
  brandSubtitle,
  homeHref,
  sections,
  utilityLinks = [],
  utilityNote,
  searchPlaceholder,
}: AppShellHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpenLabel, setDesktopOpenLabel] = useState<string | null>(null);
  const [desktopPointerOffset, setDesktopPointerOffset] = useState(0);
  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const desktopPanelRef = useRef<HTMLDivElement | null>(null);
  const desktopButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  const desktopOpenSection = sections.find(
    (section): section is AppShellSection & { items: NonNullable<AppShellSection["items"]> } =>
      section.label === desktopOpenLabel && isDropdownSection(section),
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

      if (nav?.contains(event.target as Node) || panel?.contains(event.target as Node)) {
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
        <Container maxWidth="lg">
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
              <Stack direction="row" spacing={2.25} sx={{ alignItems: "center", minWidth: 0 }}>
                <Box className="app-brand-mark">{brandMark}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: "#3f3f3f",
                      fontSize: { xs: "1.35rem", md: "1.15rem", lg: "1.4rem" },
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
              </Stack>
            </Link>

            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                display: { xs: "none", md: "flex" },
                color: "#5e6d82",
                columnGap: 1.4,
                justifyContent: "flex-end",
                rowGap: 1,
              }}
            >
              {utilityNote ? (
                <Typography
                  sx={{
                    color: "#6f7782",
                    fontSize: "0.95rem",
                    mr: 1.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {utilityNote}
                </Typography>
              ) : null}

              {utilityLinks.map((link) => (
                <Link key={link.label} href={link.href as never}>
                  <Stack
                    direction="row"
                    spacing={0.8}
                    sx={{
                      alignItems: "center",
                      color: "var(--app-accent)",
                      px: 0.85,
                      py: 0.35,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {link.label === "español" ? (
                      <LanguageOutlinedIcon sx={{ fontSize: 20, color: "#7f8790" }} />
                    ) : null}
                    {link.label === "Iniciar sesión" ? (
                      <LoginOutlinedIcon sx={{ fontSize: 20, color: "#7f8790" }} />
                    ) : null}
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 500 }}>
                      {link.label}
                    </Typography>
                  </Stack>
                </Link>
              ))}

              {searchPlaceholder ? (
                <Box
                  sx={{
                    minWidth: 270,
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid #bfc7d2",
                    color: "#666a70",
                    backgroundColor: "#ffffff",
                    pl: 1.35,
                  }}
                >
                  <Typography sx={{ fontSize: "0.95rem" }}>{searchPlaceholder}</Typography>
                  <Box
                    sx={{
                      width: 48,
                      height: 40,
                      borderLeft: "1px solid #bfc7d2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SearchRoundedIcon sx={{ color: "#6d737b" }} />
                  </Box>
                </Box>
              ) : null}
            </Stack>

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
          </Box>
        </Container>
      </Box>

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
                isSectionActive(section) || (desktopOpenLabel !== null && desktopOpenLabel === section.label);

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
                      {section.label === "Inicio" ? (
                        <HomeOutlinedIcon sx={{ fontSize: 22 }} />
                      ) : null}
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
                          desktopOpenLabel === section.label ? "rotate(180deg)" : "rotate(0deg)",
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
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 52,
            px: 2,
            color: "#ffffff",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.93rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Navegación
          </Typography>
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: 20,
              transform: mobileOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 160ms ease",
            }}
          />
        </Box>

        {mobileOpen ? <MobileMenu sections={sections} onNavigate={closeAll} /> : null}
      </Box>
    </Box>
  );
}
