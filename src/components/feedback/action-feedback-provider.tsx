"use client";

import {
  Backdrop,
  Box,
  Fade,
  Modal,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ActionFeedbackContextValue = {
  hide: () => void;
  show: (message?: string) => void;
};

const ActionFeedbackContext = createContext<ActionFeedbackContextValue | null>(
  null,
);

const DEFAULT_MESSAGE = "Estamos procesando tu solicitud.";
const DEFAULT_TITLE = "Procesando";

export function ActionFeedbackProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const hide = useCallback(() => {
    setOpen(false);
  }, []);

  const show = useCallback((nextMessage?: string) => {
    setMessage(nextMessage || DEFAULT_MESSAGE);
    setOpen(true);
  }, []);

  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const closeOnNavigate = () => {
      window.requestAnimationFrame(() => {
        hide();
      });
    };

    window.history.pushState = function pushState(...args) {
      originalPushState.apply(window.history, args);
      closeOnNavigate();
    };

    window.history.replaceState = function replaceState(...args) {
      originalReplaceState.apply(window.history, args);
      closeOnNavigate();
    };

    window.addEventListener("popstate", closeOnNavigate);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", closeOnNavigate);
    };
  }, [hide]);

  useEffect(() => {
    const handleSubmit = () => {
      show();
    };

    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, [show]);

  const value = useMemo(
    () => ({
      hide,
      show,
    }),
    [hide, show],
  );

  return (
    <ActionFeedbackContext.Provider value={value}>
      {children}
      <Modal
        open={open}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 260,
            sx: {
              background: isDarkMode
                ? "rgba(6, 10, 16, 0.76)"
                : "rgba(255,255,255,0.98)",
              backdropFilter: "blur(4px)",
            },
          },
        }}
      >
        <Fade in={open} timeout={260}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
              background:
                "radial-gradient(circle at 50% 42%, rgba(112, 161, 221, 0.12), rgba(255,255,255,0) 28%)",
            }}
          >
            <Stack
              spacing={3.5}
              sx={{
                alignItems: "center",
                width: "min(100%, 420px)",
                transform: "translateY(-4vh)",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: { xs: 136, sm: 156 },
                  height: { xs: 136, sm: 156 },
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background:
                      "conic-gradient(from 220deg, #6ec7c8 0deg, #5c8fda 120deg, #7474dc 220deg, #1e2f63 310deg, #6ec7c8 360deg)",
                    animation: "actionSpin 1400ms linear infinite",
                    filter: "drop-shadow(0 18px 34px rgba(71, 96, 158, 0.16))",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 14,
                      borderRadius: "50%",
                      background: "var(--app-surface)",
                    },
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "1px solid rgba(92, 143, 218, 0.14)",
                  }}
                />
              </Box>

              <Stack spacing={1.25} sx={{ alignItems: "center" }}>
                <Typography
                  component="h2"
                  sx={{
                    textAlign: "center",
                    color: "var(--app-ink)",
                    fontSize: "clamp(1.5rem, 2vw, 1.85rem)",
                    lineHeight: 1.1,
                    fontWeight: 500,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {DEFAULT_TITLE}
                </Typography>
                <Typography
                  component="p"
                  sx={{
                    textAlign: "center",
                    color: "var(--app-muted)",
                    fontSize: "1rem",
                    lineHeight: 1.5,
                    maxWidth: 280,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {message}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </ActionFeedbackContext.Provider>
  );
}

export function useActionFeedback() {
  const value = useContext(ActionFeedbackContext);

  if (!value) {
    throw new Error(
      "useActionFeedback debe usarse dentro de ActionFeedbackProvider.",
    );
  }

  return value;
}
