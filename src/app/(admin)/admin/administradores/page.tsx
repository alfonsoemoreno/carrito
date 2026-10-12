import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EmptyState, FormCard, SelectField, SubmitButton } from "@/components/admin/master-data-cards";
import { grantAdminAccessAction, updateAdminStatusAction } from "@/features/admin/master-data/admin-user-actions";
import { getAdminManagementData } from "@/features/admin/master-data/admin-users";
import { Box, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";

export default async function AdminUsersPage() {
  const { actor, admins, candidates } = await getAdminManagementData();

  return (
    <Container sx={{ py: { xs: 4, md: 6 } }}>
      <AdminPageShell
        eyebrow="Acceso al sistema"
        title="Administradores"
        description="Concede o suspende acceso de administración para cuentas de Neon Auth verificadas."
      >
        <FormCard
          title="Agregar administrador"
          description="La persona debe crear su cuenta primero y verificar su correo. Su acceso quedará vinculado a su ID real de Neon Auth."
        >
          {candidates.length ? (
            <form action={grantAdminAccessAction}>
              <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
                <SelectField
                  name="authUserId"
                  label="Cuenta verificada"
                  required
                  options={candidates.map((user) => ({
                    value: user.id,
                    label: `${user.name} · ${user.email}`,
                  }))}
                />
                <SubmitButton label="Conceder acceso ADMIN" />
              </Stack>
            </form>
          ) : (
            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography color="text.secondary">
                No hay cuentas nuevas verificadas para agregar. Cada administrador debe registrarse e iniciar sesión primero.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Para verificar cuentas nuevas, habilita <strong>Verify at Sign-up</strong> en Neon Console → Settings → Auth y configura el envío de correo.
              </Typography>
            </Box>
          )}
        </FormCard>

        {admins.length === 0 ? (
          <EmptyState title="Sin administradores" body="Todavía no hay cuentas administrativas vinculadas." />
        ) : (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Typography variant="h5">Cuentas con acceso</Typography>
            {admins.map((admin) => {
              const isActive = admin.status === "ACTIVE";
              const isSelf = admin.id === actor.id;
              return (
                <Card key={admin.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 0 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                      <Stack spacing={0.75}>
                        <Typography variant="h6">{admin.displayName}</Typography>
                        <Typography color="text.secondary">{admin.email}</Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip size="small" label={admin.role === "SUPERADMIN" ? "Superadministrador" : "Administrador"} />
                          <Chip size="small" color={isActive ? "success" : "default"} label={isActive ? "Activo" : "Suspendido"} />
                        </Stack>
                      </Stack>
                      {isSelf ? (
                        <Typography variant="body2" color="text.secondary">Tu cuenta</Typography>
                      ) : (
                        <form action={updateAdminStatusAction}>
                          <input type="hidden" name="adminUserId" value={admin.id} />
                          <input type="hidden" name="status" value={isActive ? "INACTIVE" : "ACTIVE"} />
                          <SubmitButton label={isActive ? "Suspender acceso" : "Restaurar acceso"} />
                        </form>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </AdminPageShell>
    </Container>
  );
}
