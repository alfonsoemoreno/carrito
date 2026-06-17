"use client";

import { Button, type ButtonProps } from "@mui/material";
import { useFormStatus } from "react-dom";
import { useEffect } from "react";
import { useActionFeedback } from "./action-feedback-provider";

type ActionSubmitButtonProps = ButtonProps & {
  loadingMessage?: string;
};

export function ActionSubmitButton({
  children,
  disabled,
  loadingMessage,
  onClick,
  type = "submit",
  ...props
}: ActionSubmitButtonProps) {
  const { pending } = useFormStatus();
  const { hide, show } = useActionFeedback();

  useEffect(() => {
    if (pending) {
      show(loadingMessage);
      return;
    }

    hide();
  }, [hide, loadingMessage, pending, show]);

  return (
    <Button
      {...props}
      type={type}
      disabled={disabled || pending}
      onClick={(event) => {
        if (!disabled && !pending) {
          show(loadingMessage);
        }

        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}
