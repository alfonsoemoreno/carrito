import { Box, Container, Divider, Stack, Typography } from "@mui/material";
import Link from "next/link";

type FooterLink = {
  href: string;
  label: string;
};

type FooterColumn = {
  title: string;
  links: ReadonlyArray<FooterLink>;
};

type AppShellFooterProps = {
  eyebrow: string;
  title: string;
  columns: ReadonlyArray<FooterColumn>;
  productLinks: ReadonlyArray<FooterLink>;
  legalLinks: ReadonlyArray<FooterLink>;
  copyright: string;
};

export function AppShellFooter({
  eyebrow,
  title,
  columns,
  productLinks,
  legalLinks,
  copyright,
}: AppShellFooterProps) {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        borderTop: "1px solid var(--app-border)",
        backgroundColor: "var(--app-surface-muted)",
        color: "var(--app-ink)",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            pt: { xs: 4.5, md: 5.5 },
            pb: { xs: 4, md: 4.5 },
          }}
        >
          <Stack spacing={3.25}>
            <Box>
              <Typography
                sx={{
                  color: "var(--app-form-label)",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {eyebrow}
              </Typography>
              <Typography
                sx={{
                  mt: 0.75,
                  color: "var(--app-ink)",
                  fontSize: { xs: "1.35rem", md: "1.55rem" },
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: { xs: 3, md: 4.5 },
              }}
            >
              {columns.map((column) => (
                <Stack key={column.title} spacing={1.1}>
                  <Typography
                    sx={{
                      color: "var(--app-ink)",
                      fontSize: "0.97rem",
                      fontWeight: 700,
                    }}
                  >
                    {column.title}
                  </Typography>
                  {column.links.map((link) => (
                    <Link
                      key={`${column.title}-${link.href}-${link.label}`}
                      href={link.href as never}
                    >
                      <Typography
                        sx={{
                          color: "var(--app-accent)",
                          fontSize: "0.95rem",
                          lineHeight: 1.45,
                          "&:hover": {
                            color: "var(--app-accent-strong)",
                          },
                        }}
                      >
                        {link.label}
                      </Typography>
                    </Link>
                  ))}
                </Stack>
              ))}
            </Box>

            <Divider sx={{ borderColor: "var(--app-border)" }} />

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", md: "center" },
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                {productLinks.map((link) => (
                  <Link
                    key={`product-${link.href}-${link.label}`}
                    href={link.href as never}
                  >
                    <Typography
                      sx={{
                        color: "var(--app-ink)",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                      }}
                    >
                      {link.label}
                    </Typography>
                  </Link>
                ))}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{ color: "var(--app-muted)", fontSize: "0.86rem" }}
                >
                  {copyright}
                </Typography>
                {legalLinks.map((link) => (
                  <Link
                    key={`legal-${link.href}-${link.label}`}
                    href={link.href as never}
                  >
                    <Typography
                      sx={{
                        color: "var(--app-muted)",
                        fontSize: "0.86rem",
                        fontWeight: 500,
                        "&:hover": {
                          color: "var(--app-ink)",
                        },
                      }}
                    >
                      {link.label}
                    </Typography>
                  </Link>
                ))}
              </Box>
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
