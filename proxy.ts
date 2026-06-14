import { auth } from "@/lib/auth/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const adminAuthProxy = auth.middleware({
  loginUrl: "/auth/sign-in",
});

export default function proxy(request: NextRequest) {
  if (
    process.env.NODE_ENV === "development" &&
    request.nextUrl.hostname === "127.0.0.1"
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.hostname = "localhost";

    return NextResponse.redirect(redirectUrl, 307);
  }

  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/account")
  ) {
    return adminAuthProxy(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
