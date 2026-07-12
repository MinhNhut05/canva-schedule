import "server-only";

import { z } from "zod";

// ---------------------------------------------------------------------------
// SAFE-01: Reject any NEXT_PUBLIC_ secret aliases
// ---------------------------------------------------------------------------
const FORBIDDEN_PUBLIC_PREFIXES = [
  "NEXT_PUBLIC_AUTH_SECRET",
  "NEXT_PUBLIC_AI_API_KEY",
  "NEXT_PUBLIC_AI_API_URL",
  "NEXT_PUBLIC_ANTHROPIC_API_KEY",
  "NEXT_PUBLIC_ANTHROPIC_BASE_URL",
  "NEXT_PUBLIC_CANVA_CLIENT_ID",
  "NEXT_PUBLIC_CANVA_CLIENT_SECRET",
  "NEXT_PUBLIC_CANVA_ACCESS_TOKEN",
  "NEXT_PUBLIC_CANVA_REFRESH_TOKEN",
  "NEXT_PUBLIC_CANVA_SHARE_WORKER_POLL_MS",
  "NEXT_PUBLIC_CANVA_SHARE_DRY_RUN",
  "NEXT_PUBLIC_CANVA_BOT_STORAGE_STATE_PATH",
  "NEXT_PUBLIC_DATABASE_URL",
];

function rejectPublicSecrets(): void {
  const leaked = FORBIDDEN_PUBLIC_PREFIXES.filter(
    (key) => process.env[key] !== undefined
  );
  if (leaked.length > 0) {
    throw new Error(
      `SAFE-01 violation: Secrets must not use NEXT_PUBLIC_ prefix. ` +
        `Remove these env vars: ${leaked.join(", ")}`
    );
  }
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const aiEnvSchema = z.object({
  AI_API_URL: z.string().min(1, "AI_API_URL is required"),
  AI_API_KEY: z.string().min(1, "AI_API_KEY is required"),
});

const canvaEnvSchema = z.object({
  CANVA_CLIENT_ID: z.string().min(1, "CANVA_CLIENT_ID is required"),
  CANVA_CLIENT_SECRET: z.string().min(1, "CANVA_CLIENT_SECRET is required"),
  // Tokens are optional in env — DB is the primary token source.
  // Env values serve only as initial seed / fallback.
  CANVA_ACCESS_TOKEN: z.string().min(1).optional(),
  CANVA_REFRESH_TOKEN: z.string().min(1).optional(),
});

const appUrlSchema = z
  .string()
  .url("AUTH_URL must be a valid absolute URL")
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "AUTH_URL must use http or https");

const emptyStringToUndefined = (value: unknown) => value === "" ? undefined : value;

const storageEnvSchema = z.object({
  S3_ENDPOINT: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  S3_REGION: z.preprocess(emptyStringToUndefined, z.string().min(1).default("auto")),
  S3_BUCKET: z.string().min(1, "S3_BUCKET is required"),
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID is required"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY is required"),
  S3_PUBLIC_URL: z.string().url("S3_PUBLIC_URL must be a valid URL"),
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Validate required startup environment variables (AUTH_SECRET, DATABASE_URL).
 * Also rejects NEXT_PUBLIC_ secret aliases per SAFE-01.
 *
 * Called from next.config.ts at startup (inline duplicate there because
 * next.config.ts cannot import from src/lib/* with server-only).
 * Also exported here so server code can invoke the canonical check.
 */
export function validateStartupEnv(): void {
  rejectPublicSecrets();

  const missing: string[] = [];
  if (!process.env.AUTH_SECRET) missing.push("AUTH_SECRET");
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.AUTH_URL) missing.push("AUTH_URL");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
        missing.map((v) => `  - ${v}`).join("\n") +
        `\n\nCopy .env.example to .env and fill in the values.`
    );
  }
}

/**
 * Validated startup env (AUTH_SECRET, DATABASE_URL).
 * Only access after validateStartupEnv() has been called.
 */
export const env = {
  get AUTH_SECRET(): string {
    return process.env.AUTH_SECRET!;
  },
  get DATABASE_URL(): string {
    return process.env.DATABASE_URL!;
  },
};

/**
 * Get AI integration environment variables.
 * Server-only — throws if AI env vars are not configured.
 */
export function getAiEnv() {
  rejectPublicSecrets();

  // AI_API_URL/AI_API_KEY take priority; ANTHROPIC_* is fallback only.
  // Shell-exported ANTHROPIC_* (e.g. from Claude Code CLI setup) must NOT
  // override the project's .env AI credentials.
  const resolved = {
    AI_API_URL: process.env.AI_API_URL ?? process.env.ANTHROPIC_BASE_URL,
    AI_API_KEY: process.env.AI_API_KEY ?? process.env.ANTHROPIC_API_KEY,
  };

  return aiEnvSchema.parse(resolved);
}

/**
 * Get Canva integration environment variables.
 * Server-only — throws if Canva env vars are not configured.
 */
export function getCanvaEnv() {
  rejectPublicSecrets();
  return canvaEnvSchema.parse(process.env);
}

export function getAppUrl(): string {
  const url = new URL(appUrlSchema.parse(process.env.AUTH_URL));
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("AUTH_URL must use https in production");
  }
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.origin;
}

/**
 * Get S3-compatible storage environment variables.
 * Server-only — throws if storage env vars are not configured.
 */
export function getStorageEnv() {
  rejectPublicSecrets();
  return storageEnvSchema.parse(process.env);
}
