import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

async function getSessionToken(request: NextRequest) {
  return (
    (await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: true,
    })) ??
    (await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: false,
    }))
  );
}

/**
 * Public Front Flow design assets (decorative mascots/logo). Allow these image
 * files through so next/image can fetch them server-side without being
 * redirected to /login. Routes under /front-flow (no file extension) stay gated.
 */
const FRONT_FLOW_ASSET = /^\/front-flow\/.*\.(?:png|jpg|jpeg|webp|svg)$/;

export async function middleware(request: NextRequest) {
  const { pathname, search, origin } = request.nextUrl;

  // Allow auth API routes, health checks, login page, and public design assets
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname === "/login" ||
    FRONT_FLOW_ASSET.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check for valid session token
  const token = await getSessionToken(request);

  // Protect everything else
  if (!token) {
    const callbackUrl = encodeURIComponent(pathname + search);
    const loginUrl = new URL(
      `/login?callbackUrl=${callbackUrl}&reason=auth-required`,
      origin
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo\\.png).*)"],
};
