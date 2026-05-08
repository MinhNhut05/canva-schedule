import { test, expect } from "@playwright/test";

const TEST_USER = {
  username: "admin",
  password: "password123",
};

async function signIn(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.fill("#username", TEST_USER.username);
  await page.fill("#password", TEST_USER.password);
  await page.getByRole("button", { name: "Vào không gian làm việc" }).click();
  await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });
}

test.describe("Personal website visual system", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto("/history");
    await expect(page).toHaveURL(/\/history/);
    await expect(page.getByTestId("visual-proof-surface")).toBeVisible();
  });

  test("proof surface keeps dark hero + light body split", async ({ page }) => {
    const proofSurface = page.getByTestId("visual-proof-surface");
    await expect(proofSurface).toBeVisible();

    const heroBlock = proofSurface.locator(".surface-hero").first();
    const cardBlock = proofSurface.locator(".surface-panel").first();

    await expect(heroBlock).toBeVisible();
    await expect(cardBlock).toBeVisible();
    await expect(heroBlock).toHaveClass(/surface-hero/);
    await expect(cardBlock).toHaveClass(/surface-panel/);
  });

  test("font contract renders heading hierarchy", async ({ page }) => {
    const title = page.getByRole("heading", { name: "Visual system contract" });
    await expect(title).toBeVisible();

    const fontFamily = await title.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily.toLowerCase()).toContain("space grotesk");
  });

  test("primitive variants render with expected state classes", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Primary action" })).toHaveClass(/bg-primary/);
    await expect(page.getByRole("button", { name: "Secondary action" })).toHaveClass(/bg-surface-panel-glass/);
    await expect(page.getByRole("button", { name: "Outline action" })).toHaveClass(/border-border-light/);
    await expect(page.getByLabel("Input sample")).toHaveClass(/bg-card/);
    await expect(page.getByLabel("Textarea sample")).toHaveClass(/bg-card/);
  });

  test("overlay and feedback primitives open with premium states", async ({ page }) => {
    await page.getByRole("button", { name: "Open sheet" }).click();
    await expect(page.getByTestId("proof-sheet-content")).toBeVisible();
    await expect(page.getByTestId("proof-sheet-content")).toHaveClass(/surface-panel-glass/);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Open alert dialog" }).click();
    const dialogContent = page.getByTestId("proof-alert-dialog-content");
    await expect(dialogContent).toBeVisible();
    await expect(dialogContent).toHaveClass(/surface-panel-glass/);

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(dialogContent).not.toBeVisible();
  });

  test("navigation links expose active and focus contract", async ({ page }) => {
    const activeLink = page.getByRole("link", { name: "Lịch sử" }).first();
    await expect(activeLink).toHaveClass(/bg-primary\/10/);

    await activeLink.focus();
    const focusedClass = await activeLink.getAttribute("class");
    expect(focusedClass ?? "").toContain("focus-visible:ring-2");
    expect(focusedClass ?? "").toContain("focus-visible:ring-primary");
  });
});
