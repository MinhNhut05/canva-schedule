import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    name: string;
    role: "admin" | "member";
    mustChangePassword: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: "admin" | "member";
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: "admin" | "member";
    mustChangePassword: boolean;
  }
}
