import { test } from "@playwright/test";

test.describe("History page", () => {
  test("authenticated user can access /history", async ({ page: _page }) => {
    // Stub: will be filled in with real auth flow when running full e2e
    test.skip(true, "E2E stub — requires authenticated session setup");
  });

  test("clicking a history row navigates to /review/[id]", async ({ page: _page }) => {
    test.skip(true, "E2E stub — requires seeded upload data");
  });

  test("empty state shows CTA to upload page", async ({ page: _page }) => {
    test.skip(true, "E2E stub — requires fresh user with no uploads");
  });
});
