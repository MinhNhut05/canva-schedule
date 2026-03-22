import type { NextAuthConfig } from "next-auth";

/**
 * Auth config used by middleware (Edge runtime compatible).
 * Does not include the credentials provider since that needs Node.js APIs.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      const isAuthApi = nextUrl.pathname.startsWith("/api/auth");

      // Allow auth API routes
      if (isAuthApi) return true;

      // Allow login page for everyone
      if (isLoginPage) return true;

      // Protect everything else
      if (!isLoggedIn) {
        const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
        const loginUrl = new URL(
          `/login?callbackUrl=${callbackUrl}&reason=auth-required`,
          nextUrl.origin
        );
        return Response.redirect(loginUrl);
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.username = (user as { username: string }).username;
        token.name = user.name!;
        token.mustChangePassword = (user as { mustChangePassword: boolean }).mustChangePassword;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.name = token.name as string;
      session.user.mustChangePassword = token.mustChangePassword as boolean;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  providers: [],
} satisfies NextAuthConfig;
