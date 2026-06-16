import { PrismaClient } from "@prisma/client";
import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// Seed user credentials (from prisma/seed.ts)
const TEST_USER = {
  username: "admin",
  password: "password123",
  name: "Admin User",
};

async function resetTestUserPassword() {
  await prisma.user.update({
    where: { username: TEST_USER.username },
    data: {
      name: TEST_USER.name,
      passwordHash: await bcrypt.hash(TEST_USER.password, SALT_ROUNDS),
      role: "admin",
      mustChangePassword: false,
    },
  });
}

test.describe("Authentication Flow", () => {
  // Tall viewport so the sidebar footer (logout) is within the clickable area.
  test.use({ viewport: { width: 1280, height: 1600 } });

  test.beforeEach(async ({ page }) => {
    await resetTestUserPassword();
    await page.context().clearCookies();
  });

  test("unauthenticated visit to /dashboard redirects to /login with callbackUrl and reason", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should redirect to login with proper query params
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("reason")).toBe("auth-required");
    expect(url.searchParams.get("callbackUrl")).toContain("/dashboard");
  });

  test("auth-required redirect lands on login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("valid login reaches the upload-first workspace", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Tải lên và trích xuất tài liệu" })).toBeVisible();
  });

  test("session persists after page refresh", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });

    await page.reload();

    await expect(page).toHaveURL(/\/upload/);
    await expect(page.getByRole("heading", { name: "Tải lên và trích xuất tài liệu" })).toBeVisible();
  });

  test("visiting /login while authenticated redirects to /upload", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });

    await page.goto("/login");
    await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });
  });

  test("logout removes access and redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });

    // Logout — button text is "Đăng xuất"
    const logoutButton = page.getByRole("button", { name: "Đăng xuất" });
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Verify can't access dashboard anymore
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("wrong password shows error message", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", "wrong-password");
    await page.click('button[type="submit"]');

    // Should show error (use first() to avoid strict mode with route announcer)
    const alert = page.locator('div[role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText("Sai tên đăng nhập hoặc mật khẩu");
  });

  test("re-login after logout creates fresh authenticated session", async ({
    page,
  }) => {
    // Login
    await page.goto("/login");
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });

    // Logout
    const logoutButton = page.getByRole("button", { name: "Đăng xuất" });
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Login again
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Tải lên và trích xuất tài liệu" })).toBeVisible();
  });
});

test.describe("Password Change", () => {
  // Tall viewport so the sidebar footer (logout) is within the clickable area.
  test.use({ viewport: { width: 1280, height: 1600 } });

  const NEW_PASSWORD = "newpass123";

  test.beforeEach(async ({ page }) => {
    await resetTestUserPassword();
    await page.context().clearCookies();
  });

  test.afterEach(async () => {
    await resetTestUserPassword();
  });

  test("successful password change allows login with new password", async ({
    page,
  }) => {
    // Login with original password
    await page.goto("/login");
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });

    // Navigate to password change
    await page.goto("/settings/password");
    await expect(
      page.getByRole("heading", { name: "Đổi mật khẩu" })
    ).toBeVisible();

    // Fill in password change form
    await page.fill("#currentPassword", TEST_USER.password);
    await page.fill("#newPassword", NEW_PASSWORD);
    await page.fill("#confirmPassword", NEW_PASSWORD);
    await page.getByRole("button", { name: "Cập nhật mật khẩu" }).click();

    // Should see success message
    await expect(
      page.getByText("Đổi mật khẩu thành công")
    ).toBeVisible({ timeout: 15000 });

    // Logout
    const logoutButton = page.getByRole("button", { name: "Đăng xuất" });
    await logoutButton.scrollIntoViewIfNeeded();
    await logoutButton.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Login with new password should work
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", NEW_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });

    // Revert password back for idempotent tests
    await page.goto("/settings/password");
    await page.fill("#currentPassword", NEW_PASSWORD);
    await page.fill("#newPassword", TEST_USER.password);
    await page.fill("#confirmPassword", TEST_USER.password);
    await page.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
    const revertStatus = page.getByText("Đổi mật khẩu thành công");
    await expect(revertStatus).toBeVisible({ timeout: 15000 });
  });
});
