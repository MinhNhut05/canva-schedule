import { chromium, type Page } from "@playwright/test";

interface ShareCanvaDesignInput {
  /** Edit URL to open. Private Connect-API URLs (/api/design/<JWT>/edit) are accepted; the public URL is captured after sharing. */
  editUrl: string;
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
 * Architecture: connects to an already-running real Google Chrome via CDP. Chrome must be
 * started with --remote-debugging-port + --user-data-dir pointing at the logged-in profile.
 * Using the real Chrome profile (not a fresh Playwright context) keeps the browser
 * fingerprint stable across login + share, so cf_clearance survives and Cloudflare is far
 * less likely to challenge the bot.
 *
 * Why "anyone with the link": the bot account is not a team admin and target users live in
 * other Canva teams, so per-email invites are rejected — public link is the only reliable path.
 */
export async function shareCanvaDesignViaPublicLink(input: ShareCanvaDesignInput): Promise<string | null> {
  if (!input.editUrl) {
    throw new Error("Missing Canva edit URL for sharing.");
  }

  const editUrl = validateCanvaEditUrl(input.editUrl);
  const port = Number.parseInt(process.env.CANVA_BOT_CHROME_PORT ?? "9222", 10);

  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>>;
  try {
    // Attach to the real Chrome that the worker keeps running on the logged-in profile.
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  } catch {
    throw new Error(
      `Không kết nối được Chrome qua CDP (port ${port}). Chrome phải đang chạy với ` +
        "--remote-debugging-port=" + port + " --user-data-dir=$CANVA_BOT_CHROME_PROFILE_DIR",
    );
  }

  try {
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error("Chrome không có context — bot đã đăng nhập Canva chưa?");
    }
    const page = context.pages()[0] ?? (await context.newPage());

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

    // Let the mutation settle.
    await page.waitForTimeout(2_000);

    // Capture the canonical public edit URL (the one others can open). Opening the
    // private Connect-API edit_url redirects here: /design/<id>/<token>/edit.
    // The Connect API only exposes the private /api/design/<JWT>/edit form.
    const current = new URL(page.url());
    if (/^\/design\/[^/]+(?:\/[^/]+)?\/edit$/.test(current.pathname)) {
      return `${current.origin}${current.pathname}`;
    }
    return null;
  } finally {
    // Close only this CDP connection — for connectOverCDP, browser.close() drops the
    // connection without terminating the underlying Chrome process, so the persistent
    // logged-in profile keeps running for the next job.
    await browser.close();
  }
}
