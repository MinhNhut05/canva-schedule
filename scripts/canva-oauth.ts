/**
 * Canva OAuth PKCE Helper Script
 *
 * Chạy 1 lần để lấy access_token + refresh_token từ Canva,
 * lưu vào database. Sau đó app tự auto-refresh.
 *
 * Usage:
 *   npx tsx scripts/canva-oauth.ts
 *
 * Prerequisites:
 *   1. CANVA_CLIENT_ID và CANVA_CLIENT_SECRET trong .env
 *   2. Thêm redirect URI http://localhost:8910/callback
 *      vào Canva Developer App settings
 *   3. Database đang chạy (docker compose up -d)
 */

import { randomBytes, createHash } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { exec } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CALLBACK_PORT = 8910;
const CALLBACK_PATH = "/callback";
const REDIRECT_URI = `http://127.0.0.1:${CALLBACK_PORT}${CALLBACK_PATH}`;
const CANVA_AUTH_URL = "https://www.canva.com/api/oauth/authorize";
const CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";
const SCOPES = "design:content:write design:content:read design:meta:read brandtemplate:meta:read brandtemplate:content:read";

// ---------------------------------------------------------------------------
// Load env
// ---------------------------------------------------------------------------
loadEnvConfig(process.cwd());

const CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "❌ Thiếu CANVA_CLIENT_ID hoặc CANVA_CLIENT_SECRET trong .env"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------
function base64url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generatePKCE() {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(
    createHash("sha256").update(verifier).digest()
  );
  return { verifier, challenge };
}

// ---------------------------------------------------------------------------
// Browser opener
// ---------------------------------------------------------------------------
function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd =
    platform === "darwin"
      ? "open"
      : platform === "win32"
        ? "start"
        : "xdg-open";

  exec(`${cmd} "${url}"`, (err) => {
    if (err) {
      console.log("\n⚠️  Không mở được browser tự động.");
      console.log("   Mở link sau trong browser:\n");
      console.log(`   ${url}\n`);
    }
  });
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

async function exchangeCode(
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    redirect_uri: REDIRECT_URI,
  });

  const response = await fetch(CANVA_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(
      `Token exchange failed (${response.status}): ${errorText}`
    );
  }

  return (await response.json()) as TokenResponse;
}

// ---------------------------------------------------------------------------
// Database save
// ---------------------------------------------------------------------------
async function saveToDatabase(tokens: TokenResponse): Promise<void> {
  const db = new PrismaClient();
  try {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Tìm token hiện tại để upsert
    const existing = await db.canvaToken.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    await db.canvaToken.upsert({
      where: { id: existing?.id ?? "oauth-seed" },
      create: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        tokenType: tokens.token_type,
        scope: tokens.scope ?? null,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        tokenType: tokens.token_type,
        scope: tokens.scope ?? null,
      },
    });

    console.log("\n✅ Token đã lưu vào database!");
    console.log(`   Hết hạn: ${expiresAt.toLocaleString()}`);
    console.log(`   Scope: ${tokens.scope ?? "N/A"}`);
    console.log(`   Access token: ${tokens.access_token.slice(0, 10)}...`);
    console.log(`   Refresh token: ${tokens.refresh_token.slice(0, 10)}...`);
  } finally {
    await db.$disconnect();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("🔑 Canva OAuth PKCE Helper");
  console.log("══════════════════════════════════════════");
  console.log(`   Client ID: ${CLIENT_ID!.slice(0, 8)}...`);
  console.log(`   Redirect URI: ${REDIRECT_URI}`);
  console.log(`   Scopes: ${SCOPES}`);
  console.log("");

  // 1. Generate PKCE
  const { verifier, challenge } = generatePKCE();
  const state = base64url(randomBytes(16));

  // 2. Build authorize URL
  const authorizeUrl = new URL(CANVA_AUTH_URL);
  authorizeUrl.searchParams.set("client_id", CLIENT_ID!);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", SCOPES);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);

  // 3. Start callback server
  const codePromise = new Promise<string>((resolve, reject) => {
    const server = createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url ?? "/", `http://localhost:${CALLBACK_PORT}`);

        if (url.pathname !== CALLBACK_PATH) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        const error = url.searchParams.get("error");
        if (error) {
          const desc = url.searchParams.get("error_description") ?? error;
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`
            <html><body style="font-family:sans-serif;text-align:center;padding:40px">
              <h1>❌ Lỗi</h1>
              <p>${desc}</p>
              <p>Bạn có thể đóng tab này.</p>
            </body></html>
          `);
          server.close();
          reject(new Error(`Canva OAuth error: ${desc}`));
          return;
        }

        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`
            <html><body style="font-family:sans-serif;text-align:center;padding:40px">
              <h1>❌ Thiếu authorization code</h1>
              <p>Bạn có thể đóng tab này.</p>
            </body></html>
          `);
          server.close();
          reject(new Error("Missing authorization code"));
          return;
        }

        if (returnedState !== state) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`
            <html><body style="font-family:sans-serif;text-align:center;padding:40px">
              <h1>❌ State mismatch — có thể bị tấn công CSRF</h1>
              <p>Bạn có thể đóng tab này và thử lại.</p>
            </body></html>
          `);
          server.close();
          reject(new Error("State mismatch — possible CSRF attack"));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
          <html><body style="font-family:sans-serif;text-align:center;padding:40px">
            <h1>✅ Thành công!</h1>
            <p>Authorization code đã nhận được.</p>
            <p>Quay lại terminal để xem kết quả.</p>
            <p style="color:#888">Bạn có thể đóng tab này.</p>
          </body></html>
        `);

        server.close();
        resolve(code);
      }
    );

    server.listen(CALLBACK_PORT, () => {
      console.log(`📡 Callback server đang chạy tại ${REDIRECT_URI}`);
      console.log("");
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Timeout — không nhận được callback sau 5 phút"));
    }, 5 * 60 * 1000);
  });

  // 4. Open browser
  console.log("🌐 Đang mở browser...");
  console.log("   Nếu browser không tự mở, hãy copy link sau:\n");
  console.log(`   ${authorizeUrl.toString()}\n`);
  console.log("⏳ Đang chờ bạn authorize trên Canva...\n");

  openBrowser(authorizeUrl.toString());

  // 5. Wait for callback
  const code = await codePromise;
  console.log("📥 Nhận được authorization code, đang exchange token...");

  // 6. Exchange code for tokens
  const tokens = await exchangeCode(code, verifier);
  console.log("🔄 Token exchange thành công!");

  // 7. Save to database
  await saveToDatabase(tokens);

  console.log("\n══════════════════════════════════════════");
  console.log("🎉 Hoàn tất! App giờ có thể tạo Canva designs.");
  console.log("   Token sẽ tự động refresh khi hết hạn.");
}

main().catch((err) => {
  console.error("\n❌ Lỗi:", err.message);
  process.exit(1);
});
