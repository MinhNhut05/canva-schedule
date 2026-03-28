import { test, expect } from "@playwright/test";

// Seed user credentials (from prisma/seed.ts)
const TEST_USER = {
  username: "admin",
  password: "password123",
  name: "Admin User",
};

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies to start fresh
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

  test("auth-required redirect shows toast notification", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Wait for Sonner toast after hydration
    const toast = page.getByText("Vui lòng đăng nhập");
    await expect(toast).toBeVisible({ timeout: 10000 });
  });

  test("valid login reaches the protected dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should reach dashboard — heading is Vietnamese "Bảng điều khiển"
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Bảng điều khiển" })).toBeVisible();
  });

  test("session persists after page refresh", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Refresh the page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Bảng điều khiển" })).toBeVisible();
  });

  test("visiting /login while authenticated redirects to /dashboard", async ({
    page,
  }) => {
    // Login first
    await page.goto("/login");
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Visit /login again
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("logout removes access and redirects to login", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Logout — button text is "Đăng xuất"
    await page.getByRole("button", { name: "Đăng xuất" }).click();
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
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Logout
    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Login again
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should reach dashboard with fresh session
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Bảng điều khiển" })).toBeVisible();
  });
});

test.describe("Password Change", () => {
  const NEW_PASSWORD = "newpass123";

  test("successful password change allows login with new password", async ({
    page,
  }) => {
    // Login with original password
    await page.goto("/login");
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to password change
    await page.goto("/settings/password");
    await expect(
      page.getByRole("heading", { name: "Đổi mật khẩu" })
    ).toBeVisible();

    // Fill in password change form
    await page.fill("#currentPassword", TEST_USER.password);
    await page.fill("#newPassword", NEW_PASSWORD);
    await page.fill("#confirmPassword", NEW_PASSWORD);
    await page.getByRole("button", { name: "Đổi mật khẩu" }).click();

    // Should see success message
    await expect(
      page.getByText("Đổi mật khẩu thành công")
    ).toBeVisible({ timeout: 15000 });

    // Logout
    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Login with new password should work
    await page.fill("#username", TEST_USER.username);
    await page.fill("#password", NEW_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Revert password back for idempotent tests
    await page.goto("/settings/password");
    await page.fill("#currentPassword", NEW_PASSWORD);
    await page.fill("#newPassword", TEST_USER.password);
    await page.fill("#confirmPassword", TEST_USER.password);
    await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
    const revertStatus = page.getByText("Đổi mật khẩu thành công");
    await expect(revertStatus).toBeVisible({ timeout: 15000 });
  });
});
