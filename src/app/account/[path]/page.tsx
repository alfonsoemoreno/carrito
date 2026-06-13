import { AccountView } from "@neondatabase/auth/react";
import { Box, Container } from "@mui/material";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <Box component="main" sx={{ py: 6 }}>
      <Container maxWidth="md">
        <AccountView path={path} />
      </Container>
    </Box>
  );
}
