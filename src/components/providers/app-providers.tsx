"use client";

import { authClient } from "@/lib/auth/client";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ActionFeedbackProvider } from "@/components/feedback/action-feedback-provider";
import { ThemeModeProvider } from "@/components/providers/theme-mode-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  const router = useRouter();
  const navigate = (href: string) => router.push(href as never);
  const replace = (href: string) => router.replace(href as never);
  const AuthLink = ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: ReactNode;
  }) => (
    <Link href={href as never} className={className}>
      {children}
    </Link>
  );

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeModeProvider>
        <ActionFeedbackProvider>
          <NeonAuthUIProvider
            authClient={authClient}
            navigate={navigate}
            replace={replace}
            onSessionChange={() => router.refresh()}
            redirectTo="/admin"
            Link={AuthLink}
          >
            {children}
          </NeonAuthUIProvider>
        </ActionFeedbackProvider>
      </ThemeModeProvider>
    </AppRouterCacheProvider>
  );
}
