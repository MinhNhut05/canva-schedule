import { chromium, type Page } from "@playwright/test";

interface ShareCanvaDesignInput {
  editUrl: string;
  storageStatePath?: string;
  userAgent?: string;
  /** Headed (false) is required: Canva blocks share mutations from headless browsers. */
  headless?: boolean;
}

const ALLOWED_CANVA_HOSTS = new Set(["www.canva.com", "canva.com"]);

// Canva UI is bilingual depending on the account language; match EN + VI.
const SHARE_BUTTON = /^(share|chia sẻ)$/i;
const ACCESS_LEVEL_COMBO = /access|quyền truy cập|only you|chỉ bạn|anyone with|bất cứ ai/i;
const ANYONE_WITH_LINK_OPTION = /anyone with (this )?link|bất cứ ai có liên kết/i;
const PERMISSION_ERROR = /can.?t update|couldn.?t update|không thể cập nhật|cấp độ quyền|permission level/i;
const CLOUDFLARE_CHALLENGE =
  /verify you are human|we['’]ll have you designing again soon|needs to review the security/i;

/** Thrown when Cloudflare challenges the bot — retrying won't help; the bot session must be re-logged-in. */
export class CanvaBotBlockedError extends Error {
  constructor(
    message = "Canva chặn bot (Cloudflare) — cần đăng nhập lại bot Canva (cf_clearance hết hạn).",
  ) {
    super(message);
    this.name = "CanvaBotBlockedError";
  }
}

/**
 * If Cloudflare is challenging the bot (expired/flagged cf_clearance), the editor
 * never loads — bail out immediately with an actionable error instead of waiting
 * out the whole Share-panel retry budget.
 */
async function assertNotCloudflareChallenged(page: Page) {
  await page.waitForTimeout(4_000);
  const title = (await page.title().catch(() => "")) ?? "";
  const challenged =
    /just a moment|attention required/i.test(title) ||
    (await page.getByText(CLOUDFLARE_CHALLENGE).first().isVisible().catch(() => false));
  if (challenged) {
    throw new CanvaBotBlockedError();
  }
}

function validateCanvaEditUrl(value: string) {
  const url = new URL(value);

  if (url.protocol !== "https:" || !ALLOWED_CANVA_HOSTS.has(url.hostname)) {
    throw new Error("Invalid Canva edit URL host.");
  }

  // Accept the real Canva edit URL shapes:
  //   /api/design/<token>/edit        (Connect API edit_url stored in production)
  //   /design/<id>/<token>/edit       (tokenized UI edit URL)
  //   /design/<id>/edit               (simple UI edit URL)
  if (!/^\/(?:api\/)?design\/[^/]+(?:\/[^/]+)?\/edit(?:\/|$)/.test(url.pathname)) {
    throw new Error("Invalid Canva design edit URL path.");
  }

  return url.toString();
}

/** Open the Share panel; the Canva editor is heavy so retry until the access combobox shows. */
async function openSharePanel(page: Page) {
  const shareButton = page.getByText(SHARE_BUTTON).first();

  // The editor is a heavy SPA; on a slow/headed-Xvfb host the Share button can
  // take tens of seconds to mount. Wait for it explicitly before polling so a
  // cold load does not exhaust the retry budget immediately.
  await shareButton.waitFor({ state: "visible", timeout: 60_000 }).catch(() => undefined);

  for (let attempt = 0; attempt < 8; attempt++) {
    if (await shareButton.isVisible().catch(() => false)) {
      await shareButton.click({ timeout: 10_000 }).catch(() => undefined);
      const combo = page.getByRole("combobox", { name: ACCESS_LEVEL_COMBO }).first();
      const opened = await combo
        .waitFor({ state: "visible", timeout: 7_000 })
        .then(() => true)
        .catch(() => false);
      if (opened) return;
    }
    await page.waitForTimeout(4_000);
  }
  throw new Error("Canva Share panel did not load in time.");
}

/**
 * Make a generated Canva design editable by anyone with the link.
 *
 * Why this instead of inviting internal users by email: the bot account is not a
 * team admin and target users live in other Canva teams, so per-email invites are
 * rejected. Setting the design link to "anyone with the link" (defaulting to edit)
 * lets every internal user open and edit it.
 *
 * Must run headed with the automation flag disabled — Canva silently rejects share
 * mutations ("can't update permission level") from headless / `navigator.webdriver`
 * browsers, even though reads succeed.
 */
export async function shareCanvaDesignViaPublicLink(input: ShareCanvaDesignInput): Promise<string | null> {
  if (!input.editUrl) {
    throw new Error("Missing Canva edit URL for sharing.");
  }

  const editUrl = validateCanvaEditUrl(input.editUrl);

  const browser = await chromium.launch({
    headless: input.headless ?? false,
    args: ["--disable-blink-features=AutomationControlled"],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  try {
    const context = await browser.newContext({
      ...(input.storageStatePath ? { storageState: input.storageStatePath } : {}),
      ...(input.userAgent ? { userAgent: input.userAgent } : {}),
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    await page.goto(editUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await assertNotCloudflareChallenged(page);
    await openSharePanel(page);

    // Open the access-level dropdown and choose "anyone with the link".
    // Canva defaults the new permission to "can edit", which is what we want.
    await page.getByRole("combobox", { name: ACCESS_LEVEL_COMBO }).first().click({ timeout: 15_000 });
    await page.getByText(ANYONE_WITH_LINK_OPTION).first().click({ timeout: 15_000 });

    // Canva applies the change immediately; surface its rejection if it fails.
    await page.waitForTimeout(4_000);
    const rejected = await page.getByText(PERMISSION_ERROR).first().isVisible().catch(() => false);
    if (rejected) {
      throw new Error("Canva rejected the access-level update.");
    }

    // Let the mutation settle before tearing the browser down.
    await page.waitForTimeout(2_000);

    // Capture the canonical public edit URL (the one others can open). Opening the
    // private Connect-API edit_url redirects here: /design/<id>/<token>/edit.
    // The Connect API only exposes the private /api/design/<JWT>/edit form.
    const current = new URL(page.url());
    if (/^\/design\/[^/]+\/[^/]+\/edit$/.test(current.pathname)) {
      return `${current.origin}${current.pathname}`;
    }
    return null;
  } finally {
    await browser.close();
  }
}
