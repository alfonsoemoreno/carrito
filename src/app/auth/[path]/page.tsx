import { AuthView } from "@neondatabase/auth/react";
import { Box, Container } from "@mui/material";

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <Box component="main" sx={{ py: 6 }}>
      <Container maxWidth="sm">
        <AuthView path={path} />
      </Container>
    </Box>
  );
}
