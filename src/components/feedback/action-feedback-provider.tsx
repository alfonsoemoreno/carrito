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
                width: "min(100%, 440px)",
                borderRadius: 5,
                overflow: "hidden",
                border: "1px solid rgba(22, 34, 54, 0.14)",
                background: "#ffffff",
                boxShadow:
                  "0 28px 80px rgba(10, 16, 28, 0.34), 0 8px 24px rgba(10, 16, 28, 0.14)",
              }}
            >
              <Box
                sx={{
                  px: 3.5,
                  pt: 3.5,
                  pb: 2,
                  borderBottom: "1px solid #e4e9f1",
                  background: "linear-gradient(180deg, #f7faff, #ffffff)",
                }}
              >
                <Stack spacing={2.5} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      position: "relative",
                      width: 112,
                      height: 112,
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
                          "radial-gradient(circle, rgba(74,109,167,0.22), rgba(74,109,167,0.03) 66%, rgba(74,109,167,0) 72%)",
                        animation: "actionHalo 1800ms ease-in-out infinite",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 12,
                        borderRadius: "50%",
                        border: "6px solid rgba(74,109,167,0.14)",
                        borderTopColor: "var(--app-accent)",
                        borderRightColor: "var(--app-accent-strong)",
                        animation: "actionSpin 980ms linear infinite",
                      }}
                    />
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        background:
                        "linear-gradient(145deg, var(--app-accent), var(--app-accent-deep))",
                        boxShadow: "0 14px 30px rgba(74,109,167,0.34)",
                        display: "grid",
                        placeItems: "center",
                        color: "#ffffff",
                        fontSize: "1.3rem",
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                      }}
                    >
                      ...
                    </Box>
                  </Box>

                  <Stack spacing={1} sx={{ alignItems: "center" }}>
                    <Typography
                      component="div"
                      sx={{
                        fontSize: "0.72rem",
                        lineHeight: 1,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--app-accent-deep)",
                      }}
                    >
                      Acción en curso
                    </Typography>
                    <Typography
                      component="h2"
                      sx={{
                        textAlign: "center",
                        color: "#142033",
                        fontSize: "1.45rem",
                        lineHeight: 1.15,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {DEFAULT_TITLE}
                    </Typography>
                    <Typography
                      component="p"
                      sx={{
                        textAlign: "center",
                        color: "#445268",
                        fontSize: "0.98rem",
                        lineHeight: 1.5,
                        maxWidth: 320,
                      }}
                    >
                      {message}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Box sx={{ px: 3.5, py: 2.25, backgroundColor: "#fbfcff" }}>
                <Stack spacing={1.25}>
                  <Box
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      overflow: "hidden",
                      backgroundColor: "#dce5f2",
                    }}
                  >
                    <Box
                      sx={{
                        width: "42%",
                        height: "100%",
                        borderRadius: 999,
                        background:
                          "linear-gradient(90deg, var(--app-accent), #7ea2dc)",
                        animation: "actionSlide 1200ms ease-in-out infinite",
                      }}
                    />
                  </Box>
                  <Typography
                    component="p"
                    sx={{
                      textAlign: "center",
                      color: "#607086",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                    }}
                  >
                    No cierres esta ventana mientras terminamos.
                  </Typography>
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
