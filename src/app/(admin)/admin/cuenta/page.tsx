import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormCard, SubmitButton } from "@/components/admin/master-data-cards";
import { getCurrentAdminLinkStatus } from "@/features/admin/master-data/auth";
import { claimInitialSuperadminAction } from "@/features/admin/master-data/auth-actions";
import { Box, Card, CardContent, Chip, Container, Divider, Typography } from "@mui/material";

export default async function AdminAccountPage() {
  const status = await getCurrentAdminLinkStatus();

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell
        eyebrow="Cuenta admin"
        title="Sesion y enlace administrativo"
        description="Verifica qué usuario de Neon Auth está autenticado y si ya quedó vinculado con `admin_users`."
      >
        <Card sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h5">Sesion actual de Neon Auth</Typography>
              {status.sessionUser ? (
                <>
                  <Typography>
                    <strong>Nombre:</strong> {status.sessionUser.name}
                  </Typography>
                  <Typography>
                    <strong>Email:</strong> {status.sessionUser.email}
                  </Typography>
                  <Typography>
                    <strong>User ID:</strong> {status.sessionUser.id}
                  </Typography>
                </>
              ) : (
                <Typography color="text.secondary">
                  No hay sesion administrativa activa.
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h5">Estado del enlace</Typography>
              {status.linkedAdmin ? (
                <>
                  <Chip
                    label={`Vinculado como ${status.linkedAdmin.role}`}
                    color="success"
                    sx={{ alignSelf: "flex-start" }}
                  />
                  <Typography>
                    <strong>Email admin:</strong> {status.linkedAdmin.email}
                  </Typography>
                  <Typography>
                    <strong>Auth Provider ID:</strong> {status.linkedAdmin.authProviderId}
                  </Typography>
                </>
              ) : (
                <>
                  <Chip
                    label="Sin vincular"
                    color="warning"
                    sx={{ alignSelf: "flex-start" }}
                  />
                  <Typography color="text.secondary">
                    Esta sesion aun no coincide con ningun registro de `admin_users`.
                  </Typography>
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        {!status.linkedAdmin && status.sessionUser && status.canBootstrap ? (
          <form action={claimInitialSuperadminAction}>
            <FormCard
              title="Bootstrap inicial de superadministrador"
              description="Como la base solo tiene administradores demo, puedes reclamar tu sesion actual como el primer superadministrador real."
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography color="text.secondary">
                  Esta accion crea o actualiza un `admin_users` activo con tu email y `user.id` reales de Neon Auth, con rol `SUPERADMIN`.
                </Typography>
                <Divider />
                <SubmitButton label="Reclamar superadministrador inicial" />
              </Box>
            </FormCard>
          </form>
        ) : null}
      </AdminPageShell>
    </Container>
  );
}
