"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import Link from "next/link";
import type { ReactNode } from "react";

type RouteButtonProps = Pick<
  ButtonProps,
  "color" | "endIcon" | "fullWidth" | "size" | "sx" | "variant"
> & {
  href: string;
  children: ReactNode;
};

export function RouteButton({ href, ...props }: RouteButtonProps) {
  return <Button component={Link} href={href} {...props} />;
}
