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
                width: "min(100%, 420px)",
                borderRadius: 6,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.42)",
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(244,247,252,0.92))",
                boxShadow:
                  "0 28px 80px rgba(10, 16, 28, 0.34), inset 0 1px 0 rgba(255,255,255,0.75)",
              }}
            >
              <Box
                sx={{
                  px: 3,
                  pt: 3,
                  pb: 1.5,
                  background:
                    "linear-gradient(180deg, rgba(74,109,167,0.12), rgba(74,109,167,0))",
                }}
              >
                <Stack spacing={2.5} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      position: "relative",
                      width: 96,
                      height: 96,
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
                          "radial-gradient(circle, rgba(74,109,167,0.28), rgba(74,109,167,0.02) 68%)",
                        animation: "actionHalo 1800ms ease-in-out infinite",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 10,
                        borderRadius: "50%",
                        border: "3px solid rgba(74,109,167,0.18)",
                        borderTopColor: "var(--app-accent)",
                        animation: "actionSpin 980ms linear infinite",
                      }}
                    />
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(145deg, var(--app-accent), var(--app-accent-deep))",
                        boxShadow: "0 14px 30px rgba(74,109,167,0.34)",
                      }}
                    />
                  </Box>

                  <Stack spacing={1} sx={{ alignItems: "center" }}>
                    <Typography
                      variant="h5"
                      sx={{ textAlign: "center", color: "#1f2a3d" }}
                    >
                      Procesando acción
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: "center",
                        color: "#5f6c80",
                        maxWidth: 300,
                      }}
                    >
                      {message}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Box sx={{ px: 3, pb: 3 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: "center", alignItems: "center" }}
                >
                  {[0, 1, 2].map((index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: "var(--app-accent)",
                        opacity: 0.9,
                        animation: "actionPulse 900ms ease-in-out infinite",
                        animationDelay: `${index * 140}ms`,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
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
