import type { NextAuthConfig } from "next-auth";

/**
 * Auth config shared between main NextAuth instance and middleware.
 * Route protection is handled by src/middleware.ts using getToken().
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.username = (user as { username: string }).username;
        token.name = user.name!;
        token.role = (user as { role: "admin" | "member" }).role;
        token.mustChangePassword = (user as { mustChangePassword: boolean }).mustChangePassword;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.name = token.name as string;
      session.user.role = token.role as "admin" | "member";
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
