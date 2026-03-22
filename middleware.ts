import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Match all routes except static files, _next, and favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
