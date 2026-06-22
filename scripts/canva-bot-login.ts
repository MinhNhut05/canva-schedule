/**
 * Canva Bot Login Helper (chế độ attach Chrome thật qua CDP)
 *
 * Chạy 1 lần để đăng nhập Canva bằng TÀI KHOẢN TẠO DESIGN và lưu lại phiên
 * (storageState) ra file JSON. Worker chia sẻ (scripts/canva-share-worker.ts)
 * dùng file này để mở Canva dưới danh nghĩa tài khoản đó mà không cần đăng nhập lại.
 *
 * Vì sao KHÔNG dùng Chromium của Playwright trực tiếp:
 *   Playwright khởi chạy browser với cờ automation (navigator.webdriver = true),
 *   nên đăng nhập "Continue with Google" sẽ bị Google chặn bằng vòng lặp captcha.
 *   Thay vào đó script mở Google Chrome THẬT của bạn qua child_process (chỉ bật
 *   --remote-debugging-port, KHÔNG bật cờ automation) → Google không chặn →
 *   sau khi bạn đăng nhập xong, tool gắn vào qua CDP để hút cookie/phiên ra file.
 *
 * Usage:
 *   pnpm canva:bot-login                       # lưu ra canva-bot.storage-state.json
 *   pnpm canva:bot-login path/to/state.json    # lưu ra đường dẫn tùy chọn
 *
 * Prerequisites:
 *   1. Đã cài Google Chrome (script tự tìm /usr/bin/google-chrome, hoặc đặt
 *      CANVA_BOT_CHROME_PATH trỏ tới Chrome).
 *   2. Máy có giao diện đồ họa.
 *
 * ⚠️ File phiên = chìa khóa đăng nhập, coi như mật khẩu. Đã được .gitignore
 *    chặn (*.storage-state.json). TUYỆT ĐỐI không commit / chia sẻ file này.
 */

import { resolve, join } from "node:path";
import { existsSync, statSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { loadEnvConfig } from "@next/env";
import { chromium } from "@playwright/test";

loadEnvConfig(process.cwd());

const DEFAULT_OUTPUT = "canva-bot.storage-state.json";
const LOGIN_URL = "https://www.canva.com/login";
const DEBUG_PORT = Number.parseInt(process.env.CANVA_BOT_CHROME_PORT ?? "9222", 10);
// Persistent profile dir — the SHARE WORKER connects to a Chrome started on this SAME
// dir via CDP, so login + share share one browser fingerprint (keeps cf_clearance alive).
// Default to a stable on-disk path; falls back to /tmp only if env is unset AND not on the VPS.
const PROFILE_DIR =
  process.env.CANVA_BOT_CHROME_PROFILE_DIR || join(tmpdir(), "canva-bot-chrome-profile");

const CHROME_CANDIDATES = [
  process.env.CANVA_BOT_CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((value): value is string => Boolean(value));

function findChrome(): string {
  for (const candidate of CHROME_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Không tìm thấy Google Chrome. Đặt CANVA_BOT_CHROME_PATH trỏ tới file Chrome.",
  );
}

function resolveOutputPath(): string {
  const fromArg = process.argv[2];
  const fromEnv = process.env.CANVA_BOT_STORAGE_STATE_PATH;
  return resolve(process.cwd(), fromArg || fromEnv || DEFAULT_OUTPUT);
}

async function waitForEnter(message: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    await rl.question(message);
  } finally {
    rl.close();
  }
}

function countCanvaCookies(outputPath: string): number {
  try {
    const parsed = JSON.parse(readFileSync(outputPath, "utf8")) as {
      cookies?: Array<{ domain?: string }>;
    };
    return (parsed.cookies ?? []).filter((cookie) =>
      (cookie.domain ?? "").includes("canva"),
    ).length;
  } catch {
    return 0;
  }
}

async function main(): Promise<void> {
  const outputPath = resolveOutputPath();
  const chromePath = findChrome();

  console.log("🔐 Canva Bot Login Helper (CDP)");
  console.log("══════════════════════════════════════════");
  console.log(`   Chrome:    ${chromePath}`);
  console.log(`   Debug port: ${DEBUG_PORT}`);
  console.log(`   Profile:   ${PROFILE_DIR}`);
  console.log(`   File phiên: ${outputPath}`);
  console.log("");
  console.log("🌐 Đang mở Google Chrome thật tới trang đăng nhập Canva...");

  const child = spawn(
    chromePath,
    [
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${PROFILE_DIR}`,
      "--no-first-run",
      "--no-default-browser-check",
      LOGIN_URL,
    ],
    { stdio: "ignore" },
  );

  child.on("error", (error) => {
    console.error("\n❌ Không mở được Chrome:", error.message);
    process.exit(1);
  });

  console.log("");
  console.log("👉 Trong cửa sổ Chrome vừa mở:");
  console.log("   1. Đăng nhập Canva bằng TÀI KHOẢN tạo design (Continue with Google OK).");
  console.log("   2. Đợi vào tới trang chính của Canva (home/folder).");
  console.log("   3. Quay lại terminal này và nhấn Enter để hút phiên.");
  console.log("");

  await waitForEnter("⏳ Đăng nhập xong thì nhấn Enter để lưu phiên... ");

  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${DEBUG_PORT}`);
  let userAgent = "";
  try {
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error("Không tìm thấy context nào trong Chrome — bạn đã đăng nhập chưa?");
    }
    const page = context.pages()[0] ?? (await context.newPage());
    userAgent = await page.evaluate(() => navigator.userAgent).catch(() => "");
    await context.storageState({ path: outputPath });
  } finally {
    await browser.close();
    child.kill();
  }

  if (!existsSync(outputPath) || statSync(outputPath).size === 0) {
    throw new Error("Không lưu được file phiên — thử đăng nhập lại.");
  }

  const canvaCookies = countCanvaCookies(outputPath);
  if (canvaCookies === 0) {
    console.warn(
      "\n⚠️  File đã lưu nhưng KHÔNG thấy cookie canva.com — có thể bạn chưa đăng nhập xong. Hãy chạy lại sau khi vào được trang chính Canva.",
    );
  }

  const hasClearance = (() => {
    try {
      const parsed = JSON.parse(readFileSync(outputPath, "utf8")) as {
        cookies?: Array<{ name?: string }>;
      };
      return (parsed.cookies ?? []).some((c) => c.name === "cf_clearance");
    } catch {
      return false;
    }
  })();
  if (!hasClearance) {
    console.warn(
      "\n⚠️  KHÔNG thấy cookie cf_clearance — Cloudflare có thể chặn worker. " +
        "Nếu trong lúc đăng nhập gặp trang 'Verify you are human', hãy tick rồi đăng nhập lại.",
    );
  }

  console.log("");
  console.log(`✅ Đã lưu phiên đăng nhập! (${canvaCookies} cookie canva.com, cf_clearance=${hasClearance})`);
  console.log("══════════════════════════════════════════");
  console.log("   PROFILE bền vững (worker dùng chung qua CDP):");
  console.log(`   CANVA_BOT_CHROME_PROFILE_DIR=${PROFILE_DIR}`);
  console.log("");
  console.log("   Worker mới KHÔNG cần storageState — chỉ cần profile dir trên + Chrome chạy với:");
  console.log(`   google-chrome --remote-debugging-port=${DEBUG_PORT} --user-data-dir=${PROFILE_DIR}`);
  if (userAgent) {
    console.log("");
    console.log(`   (tham khảo) User-Agent: ${userAgent}`);
  }
  console.log("");
  console.log("   Sau đó đặt CANVA_SHARE_DRY_RUN=false rồi chạy worker:");
  console.log("   pnpm canva:share-worker");
}

main().catch((err) => {
  console.error("\n❌ Lỗi:", err instanceof Error ? err.message : err);
  process.exit(1);
});
