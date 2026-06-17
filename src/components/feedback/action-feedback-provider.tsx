"use client";

import {
  Backdrop,
  Box,
  Fade,
  Modal,
  Stack,
  Typography,
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

export function ActionFeedbackProvider({
  children,
}: {
  children: ReactNode;
}) {
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
              background:
                "radial-gradient(circle at top, rgba(74,109,167,0.28), rgba(15,22,36,0.58) 55%, rgba(10,14,24,0.74) 100%)",
              backdropFilter: "blur(8px)",
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
            }}
          >
            <Box
              sx={{
                width: "min(100%, 360px)",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.18)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,255,0.94))",
                boxShadow:
                  "0 24px 72px rgba(9, 16, 30, 0.32), inset 0 1px 0 rgba(255,255,255,0.82)",
                px: 4,
                py: 4.5,
              }}
            >
              <Stack spacing={3} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    position: "relative",
                    width: 92,
                    height: 92,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "6px solid rgba(74,109,167,0.12)",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "6px solid transparent",
                      borderTopColor: "var(--app-accent)",
                      borderRightColor: "var(--app-accent-strong)",
                      animation: "actionSpin 900ms linear infinite",
                      filter: "drop-shadow(0 10px 18px rgba(74,109,167,0.22))",
                    }}
                  />
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle at 30% 30%, #ffffff, #edf3fb 72%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 18px rgba(20,32,51,0.08)",
                    }}
                  />
                </Box>

                <Stack spacing={1} sx={{ alignItems: "center" }}>
                  <Typography
                    component="h2"
                    sx={{
                      textAlign: "center",
                      color: "#162338",
                      fontSize: "1.35rem",
                      lineHeight: 1.15,
                      fontWeight: 750,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {DEFAULT_TITLE}
                  </Typography>
                  <Typography
                    component="p"
                    sx={{
                      textAlign: "center",
                      color: "#536277",
                      fontSize: "0.96rem",
                      lineHeight: 1.5,
                      maxWidth: 260,
                    }}
                  >
                    {message}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
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
