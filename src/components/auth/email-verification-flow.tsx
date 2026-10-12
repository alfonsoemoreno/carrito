"use client";

import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/lib/auth/client";

export function EmailVerificationFlow() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode() {
    setBusy(true);
    setError(null);

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "email-verification",
        fetchOptions: { throw: true },
      });
      setCodeSent(true);
    } catch {
      setError("No pudimos enviar el código. Revisa el correo e inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestCode();
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email: email.trim(),
        otp: otp.trim(),
        fetchOptions: { throw: true },
      });
      if (!result.status) {
        throw new Error("No se pudo verificar el correo.");
      }
      setVerified(true);
    } catch {
      setError("El código no es válido o venció. Solicita uno nuevo e inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h5">Verifica tu correo</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Necesitas confirmar el correo de tu cuenta antes de iniciar sesión.
        </Typography>
      </Box>

      {verified ? (
        <Stack spacing={2}>
          <Alert severity="success">
            Correo verificado. Ya puedes iniciar sesión con tu contraseña.
          </Alert>
          <Button component={Link} href="/auth/sign-in" variant="contained" fullWidth>
            Ir a iniciar sesión
          </Button>
        </Stack>
      ) : codeSent ? (
        <Box
          component="form"
          onSubmit={verifyCode}
          data-suppress-global-feedback="true"
        >
          <Stack spacing={2}>
            <Alert severity="info">
              Enviamos un código a {email}. Revisa también la carpeta de correo no deseado.
            </Alert>
            <TextField
              label="Código de verificación"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              autoComplete="one-time-code"
              slotProps={{
                htmlInput: { inputMode: "numeric", autoComplete: "one-time-code" },
              }}
              required
              disabled={busy}
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Button type="submit" variant="contained" disabled={busy || !otp.trim()}>
              {busy ? "Verificando…" : "Confirmar correo"}
            </Button>
            <Button type="button" variant="text" onClick={requestCode} disabled={busy}>
              Reenviar código
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box
          component="form"
          onSubmit={sendCode}
          data-suppress-global-feedback="true"
        >
          <Stack spacing={2}>
            <TextField
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={busy}
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Button type="submit" variant="contained" disabled={busy || !email.trim()}>
              {busy ? "Enviando código…" : "Enviar código"}
            </Button>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
