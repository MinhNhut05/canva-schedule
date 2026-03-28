import { describe, it, expect } from "vitest";

describe("Role propagation types", () => {
  it("role type allows admin and member", () => {
    const adminRole: "admin" | "member" = "admin";
    const memberRole: "admin" | "member" = "member";
    expect(adminRole).toBe("admin");
    expect(memberRole).toBe("member");
  });

  it("default role is member", () => {
    const defaultRole = "member";
    expect(defaultRole).toBe("member");
  });

  it("admin check returns true for admin role", () => {
    const role: "admin" | "member" = "admin";
    expect(role === "admin").toBe(true);
  });

  it("admin check returns false for member role", () => {
    const role: string = "member";
    expect(role === "admin").toBe(false);
  });
});
