import { chromium } from "@playwright/test";

interface ShareCanvaDesignInput {
  editUrl: string;
  targetEmails: string[];
  storageStatePath?: string;
}

const SHARE_BUTTON_NAME = /share|chia sẻ/i;
const EMAIL_INPUT_NAME = /email|people|người|mời/i;
const EDIT_PERMISSION_NAME = /can edit|edit|chỉnh sửa/i;
const SEND_BUTTON_NAME = /send|share|invite|gửi|chia sẻ|mời/i;
const ALLOWED_CANVA_HOSTS = new Set(["www.canva.com", "canva.com"]);

function validateCanvaEditUrl(value: string) {
  const url = new URL(value);

  if (url.protocol !== "https:" || !ALLOWED_CANVA_HOSTS.has(url.hostname)) {
    throw new Error("Invalid Canva edit URL host.");
  }

  if (!/^\/design\/[^/]+\/edit(\/|$)/.test(url.pathname)) {
    throw new Error("Invalid Canva design edit URL path.");
  }

  return url.toString();
}

export async function shareCanvaDesignWithEmails(input: ShareCanvaDesignInput) {
  if (!input.editUrl) {
    throw new Error("Missing Canva edit URL for sharing.");
  }

  if (input.targetEmails.length === 0) {
    return;
  }

  const editUrl = validateCanvaEditUrl(input.editUrl);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext(
      input.storageStatePath ? { storageState: input.storageStatePath } : undefined,
    );
    const page = await context.newPage();

    await page.goto(editUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.getByRole("button", { name: SHARE_BUTTON_NAME }).click({ timeout: 30_000 });

    const emailInput = page.getByRole("textbox", { name: EMAIL_INPUT_NAME }).first();
    await emailInput.click({ timeout: 30_000 });

    for (const email of input.targetEmails) {
      await emailInput.fill(email);
      await emailInput.press("Enter");
    }

    const editPermission = page.getByRole("button", { name: EDIT_PERMISSION_NAME }).first();
    if (await editPermission.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editPermission.click();
    }

    await page.getByRole("button", { name: SEND_BUTTON_NAME }).last().click({ timeout: 30_000 });
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
  } finally {
    await browser.close();
  }
}
