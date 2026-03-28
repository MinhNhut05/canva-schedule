#!/usr/bin/env tsx
/**
 * Canva Capability Probe — Phase 1 Go/No-Go Gate (CANVA-07)
 *
 * Verifies the intended autofill workflow against the real SOHA Travel
 * Canva account and Brand Template setup. This is a repeatable, automated
 * probe — not a one-off manual test.
 *
 * Three verification steps (ALL must pass for GO):
 *   Step 1: API Connectivity — authenticate and confirm the specified
 *           Brand Template is reachable in the authenticated workspace
 *   Step 2: Template Autofill — fetch the real template dataset and submit
 *           an autofill job with probe text into available text fields
 *   Step 3: Editable Link — poll until completion and require an editable
 *           Canva URL in the result
 *
 * Exit codes:
 *   0 = GO  — all three steps passed
 *   1 = NO-GO — at least one step failed (details in structured output)
 *
 * Usage: npx tsx scripts/canva-probe.ts
 *
 * Requires env vars (from .env.local):
 *   CANVA_CLIENT_ID, CANVA_CLIENT_SECRET,
 *   CANVA_ACCESS_TOKEN, CANVA_REFRESH_TOKEN,
 *   CANVA_TEMPLATE_ID
 */

import { loadEnvConfig } from "@next/env";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Load environment (same .env files Next.js uses — .env, .env.local, etc.)
// ---------------------------------------------------------------------------
loadEnvConfig(process.cwd());

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CANVA_API_BASE = "https://api.canva.com/rest/v1";
const MAX_POLL_ATTEMPTS = 20;
const POLL_DELAYS_MS = [
  1000, 2000, 3000, 5000, 5000, 5000, 10000, 10000, 10000, 10000,
];

/**
 * Patterns that indicate a placeholder value rather than a real credential.
 * The probe rejects these to ensure only real SOHA Travel credentials are used.
 */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^change[-_]?me/i,
  /^placeholder/i,
  /^your[-_]?canva/i,
  /^your[-_]?brand/i,
  /^your[-_]?access/i,
  /^your[-_]?client/i,
  /^your[-_]?refresh/i,
  /^xxx+$/i,
  /^todo/i,
  /^replace[-_]?me/i,
  /^fake[-_]?/i,
  /^test[-_]?token/i,
  /^sample[-_]?/i,
  /^insert[-_]?/i,
  /^demo[-_]?/i,
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StepResult {
  step: string;
  status: "PASS" | "FAIL";
  httpStatus?: number;
  responseExcerpt?: string;
  templateId?: string;
  details?: Record<string, unknown>;
  error?: string;
}

interface ProbeResult {
  timestamp: string;
  templateId: string;
  steps: StepResult[];
  verdict: "GO" | "NO-GO";
  editUrl?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Env Validation — mirrors getCanvaEnv() from src/lib/env.ts + CANVA_TEMPLATE_ID
// ---------------------------------------------------------------------------
const probeEnvSchema = z.object({
  CANVA_CLIENT_ID: z.string().min(1, "CANVA_CLIENT_ID is required"),
  CANVA_CLIENT_SECRET: z.string().min(1, "CANVA_CLIENT_SECRET is required"),
  CANVA_ACCESS_TOKEN: z.string().min(1, "CANVA_ACCESS_TOKEN is required"),
  CANVA_REFRESH_TOKEN: z.string().min(1, "CANVA_REFRESH_TOKEN is required"),
  CANVA_TEMPLATE_ID: z.string().min(1, "CANVA_TEMPLATE_ID is required"),
});

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => p.test(value.trim()));
}

function validateEnv(): z.infer<typeof probeEnvSchema> {
  // 1. Zod schema validation — checks presence and non-empty
  const parsed = probeEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(
      `Missing required environment variables: ${missing}\n` +
        `Set these in .env.local before running the probe.`
    );
  }

  // 2. Reject placeholder-looking values (D-12: must use real credentials)
  const env = parsed.data;
  const placeholders: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (isPlaceholder(value)) {
      placeholders.push(`${key}="${value}"`);
    }
  }

  if (placeholders.length > 0) {
    throw new Error(
      `Placeholder credentials detected:\n` +
        placeholders.map((p) => `  - ${p}`).join("\n") +
        `\n\nThe probe requires real SOHA Travel Canva credentials, not placeholders.\n` +
        `Update .env.local with actual values from the Canva developer/integration settings.`
    );
  }

  return env;
}

// ---------------------------------------------------------------------------
// Canva API helpers
// ---------------------------------------------------------------------------
async function canvaFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<{ status: number; ok: boolean; body: unknown; bodyText: string }> {
  const url = `${CANVA_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const bodyText = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = bodyText;
  }

  return { status: res.status, ok: res.ok, body, bodyText };
}

function truncate(text: string, max = 500): string {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

// ---------------------------------------------------------------------------
// Step 1: API Connectivity — verify the specified Brand Template is reachable
// ---------------------------------------------------------------------------
async function step1_verifyConnectivity(
  token: string,
  templateId: string
): Promise<StepResult> {
  const stepName = "Step 1: API Connectivity";
  console.log(`\n── ${stepName} ──`);
  console.log(`  Target template: ${templateId}`);
  console.log(`  Verifying template is reachable in authenticated workspace...`);

  try {
    const res = await canvaFetch(`/brand-templates/${templateId}`, token);

    if (res.ok) {
      const body = res.body as Record<string, unknown> | undefined;
      const bt = body?.brand_template as Record<string, unknown> | undefined;
      const templateTitle = (bt?.title as string) || "(unknown title)";
      console.log(`  PASS — Template reachable: "${templateTitle}"`);
      return {
        step: stepName,
        status: "PASS",
        httpStatus: res.status,
        templateId,
        details: { templateTitle },
      };
    }

    console.log(`  FAIL — HTTP ${res.status}`);
    return {
      step: stepName,
      status: "FAIL",
      httpStatus: res.status,
      responseExcerpt: truncate(res.bodyText),
      templateId,
      error:
        res.status === 403
          ? "Permission denied. The Canva account may lack Brand Template access (requires Canva Enterprise)."
          : res.status === 404
            ? "Template not found. The CANVA_TEMPLATE_ID may be invalid or the template is not a Brand Template."
            : res.status === 401
              ? "Authentication failed. The CANVA_ACCESS_TOKEN may be expired or invalid."
              : `Canva API returned HTTP ${res.status}.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`  FAIL — Network error: ${message}`);
    return {
      step: stepName,
      status: "FAIL",
      templateId,
      error: `Network error: ${message}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Step 2: Fetch dataset and submit autofill job with probe text
// ---------------------------------------------------------------------------
async function step2_autofillTemplate(
  token: string,
  templateId: string
): Promise<{ result: StepResult; jobId?: string }> {
  const stepName = "Step 2: Template Autofill";
  console.log(`\n── ${stepName} ──`);

  try {
    // 2a. Fetch the template dataset (field definitions)
    console.log("  Fetching template dataset...");
    const datasetRes = await canvaFetch(
      `/brand-templates/${templateId}/dataset`,
      token
    );

    if (!datasetRes.ok) {
      console.log(`  FAIL — Dataset fetch HTTP ${datasetRes.status}`);
      return {
        result: {
          step: stepName,
          status: "FAIL",
          httpStatus: datasetRes.status,
          responseExcerpt: truncate(datasetRes.bodyText),
          templateId,
          error:
            datasetRes.status === 403
              ? "Permission denied fetching dataset. Brand Template content read scope may not be granted, or account requires Enterprise."
              : `Failed to fetch template dataset. HTTP ${datasetRes.status}.`,
        },
      };
    }

    const datasetBody = datasetRes.body as Record<string, unknown> | undefined;
    const dataset = (datasetBody?.dataset || {}) as Record<
      string,
      { type: string }
    >;
    const fieldKeys = Object.keys(dataset);
    const fieldSummary = fieldKeys.map(
      (k) => `${k} (${dataset[k].type})`
    );
    console.log(
      `  Dataset fetched: ${fieldKeys.length} field(s): [${fieldSummary.join(", ")}]`
    );

    // 2b. Build probe payload — fill text fields with Vietnamese probe text
    const probeData: Record<string, { type: string; text?: string }> = {};
    for (const [key, def] of Object.entries(dataset)) {
      if (def.type === "text") {
        probeData[key] = {
          type: "text",
          text: `[PROBE] ${key} — Xin chao, kiem tra tu dong ${new Date().toISOString()}`,
        };
      }
      // Skip image and other non-text fields — text probe only
    }

    const textFieldCount = Object.keys(probeData).length;
    if (textFieldCount === 0) {
      console.log("  FAIL — No text fields found in template dataset");
      return {
        result: {
          step: stepName,
          status: "FAIL",
          templateId,
          details: { fieldKeys, fieldSummary },
          error:
            "Template has no text fields available for autofill. " +
            "Verify the Brand Template has named text elements.",
        },
      };
    }

    console.log(
      `  Submitting autofill job with ${textFieldCount} text field(s)...`
    );

    // 2c. Create autofill job
    const autofillRes = await canvaFetch("/autofills", token, {
      method: "POST",
      body: JSON.stringify({
        brand_template_id: templateId,
        title: `[PROBE] SileTravel Canva Probe - ${new Date().toISOString()}`,
        data: probeData,
      }),
    });

    if (!autofillRes.ok) {
      console.log(`  FAIL — Autofill creation HTTP ${autofillRes.status}`);
      return {
        result: {
          step: stepName,
          status: "FAIL",
          httpStatus: autofillRes.status,
          responseExcerpt: truncate(autofillRes.bodyText),
          templateId,
          details: { fieldKeys, textFieldCount },
          error:
            autofillRes.status === 403
              ? "Permission denied creating autofill job. The account may require Canva Enterprise for autofill API access."
              : `Autofill job creation failed with HTTP ${autofillRes.status}.`,
        },
      };
    }

    const autofillBody = autofillRes.body as Record<string, unknown> | undefined;
    const job = autofillBody?.job as Record<string, unknown> | undefined;
    const jobId = job?.id as string | undefined;
    const jobStatus = job?.status as string | undefined;
    console.log(`  PASS — Job created: ${jobId} (status: ${jobStatus})`);

    return {
      result: {
        step: stepName,
        status: "PASS",
        httpStatus: autofillRes.status,
        templateId,
        details: { jobId, jobStatus, fieldKeys, fieldSummary, textFieldCount },
      },
      jobId: jobId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`  FAIL — ${message}`);
    return {
      result: {
        step: stepName,
        status: "FAIL",
        templateId,
        error: `Error during autofill: ${message}`,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Step 3: Poll for completion and require editable Canva URL
// ---------------------------------------------------------------------------
async function step3_pollForEditableLink(
  token: string,
  jobId: string,
  templateId: string
): Promise<StepResult> {
  const stepName = "Step 3: Editable Link Retrieval";
  console.log(`\n── ${stepName} ──`);
  console.log(`  Polling job ${jobId}...`);

  try {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const delay =
        POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)];

      const res = await canvaFetch(`/autofills/${jobId}`, token);

      if (!res.ok) {
        console.log(`  FAIL — Poll request HTTP ${res.status}`);
        return {
          step: stepName,
          status: "FAIL",
          httpStatus: res.status,
          responseExcerpt: truncate(res.bodyText),
          templateId,
          error: `Poll request failed with HTTP ${res.status}.`,
        };
      }

      const resBody = res.body as Record<string, unknown> | undefined;
      const job = resBody?.job as Record<string, unknown> | undefined;
      const status = job?.status as string | undefined;

      if (status === "success") {
        const result = job?.result as Record<string, unknown> | undefined;
        const design = result?.design as Record<string, unknown> | undefined;
        const urls = design?.urls as Record<string, string> | undefined;
        const editUrl = urls?.edit_url || (design?.url as string | undefined);
        const designId = design?.id as string | undefined;

        if (editUrl) {
          console.log(`  PASS — Edit URL: ${editUrl}`);
          return {
            step: stepName,
            status: "PASS",
            httpStatus: res.status,
            templateId,
            details: { designId, editUrl, jobStatus: status },
          };
        }

        console.log("  FAIL — Job succeeded but no edit URL in response");
        return {
          step: stepName,
          status: "FAIL",
          httpStatus: res.status,
          responseExcerpt: truncate(res.bodyText),
          templateId,
          error:
            "Autofill job completed with status=success but no editable URL was returned.",
          details: { designId, jobResult: result },
        };
      }

      if (status === "failed") {
        const jobError = job?.error as Record<string, string> | undefined;
        const errorCode = jobError?.code || "unknown";
        const errorMsg = jobError?.message || "No details provided";
        console.log(`  FAIL — Job error: ${errorCode} — ${errorMsg}`);
        return {
          step: stepName,
          status: "FAIL",
          httpStatus: res.status,
          templateId,
          error: `Autofill job failed: [${errorCode}] ${errorMsg}`,
          details: { errorCode, errorMessage: errorMsg },
        };
      }

      // Still in_progress
      console.log(
        `  Attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS}: status=${status}, waiting ${delay}ms...`
      );
      await new Promise((r) => setTimeout(r, delay));
    }

    console.log(`  FAIL — Timed out after ${MAX_POLL_ATTEMPTS} poll attempts`);
    return {
      step: stepName,
      status: "FAIL",
      templateId,
      error: `Job did not complete within ${MAX_POLL_ATTEMPTS} poll attempts. The autofill may be stuck or taking too long.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`  FAIL — ${message}`);
    return {
      step: stepName,
      status: "FAIL",
      templateId,
      error: `Polling error: ${message}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
export async function main(): Promise<ProbeResult> {
  console.log(
    "╔═══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║  Canva Capability Probe — Phase 1 Go/No-Go Gate (CANVA-07)  ║"
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝"
  );
  console.log(`\nTimestamp: ${new Date().toISOString()}`);

  // ── Validate environment ──────────────────────────────────────────────
  const env = validateEnv();
  const { CANVA_ACCESS_TOKEN: token, CANVA_TEMPLATE_ID: templateId } = env;
  console.log(`Template ID: ${templateId}`);
  console.log(`Client ID:   ${env.CANVA_CLIENT_ID.slice(0, 8)}...`);

  const steps: StepResult[] = [];

  // ── Step 1: API Connectivity ──────────────────────────────────────────
  const step1 = await step1_verifyConnectivity(token, templateId);
  steps.push(step1);
  if (step1.status === "FAIL") {
    return buildResult(templateId, steps, "NO-GO");
  }

  // ── Step 2: Template Autofill ─────────────────────────────────────────
  const { result: step2, jobId } = await step2_autofillTemplate(
    token,
    templateId
  );
  steps.push(step2);
  if (step2.status === "FAIL" || !jobId) {
    return buildResult(templateId, steps, "NO-GO");
  }

  // ── Step 3: Editable Link Retrieval ───────────────────────────────────
  const step3 = await step3_pollForEditableLink(token, jobId, templateId);
  steps.push(step3);

  const allPassed = steps.every((s) => s.status === "PASS");
  const editUrl = step3.details?.editUrl as string | undefined;

  return buildResult(
    templateId,
    steps,
    allPassed ? "GO" : "NO-GO",
    editUrl
  );
}

function buildResult(
  templateId: string,
  steps: StepResult[],
  verdict: "GO" | "NO-GO",
  editUrl?: string
): ProbeResult {
  const result: ProbeResult = {
    timestamp: new Date().toISOString(),
    templateId,
    steps,
    verdict,
    editUrl,
  };

  // ── Print summary ───────────────────────────────────────────────────
  console.log(
    "\n════════════════════════════════════════════════════════════════"
  );
  console.log(`  VERDICT: ${result.verdict}`);
  for (const s of steps) {
    console.log(`  ${s.status === "PASS" ? "PASS" : "FAIL"} ${s.step}`);
    if (s.error) console.log(`       ${s.error}`);
  }
  if (editUrl) {
    console.log(`  Edit URL: ${editUrl}`);
  }
  console.log(
    "════════════════════════════════════════════════════════════════\n"
  );

  // ── Machine-readable JSON output ──────────────────────────────────
  console.log("--- MACHINE-READABLE RESULT ---");
  console.log(JSON.stringify(result, null, 2));

  return result;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
main()
  .then((result) => {
    process.exit(result.verdict === "GO" ? 0 : 1);
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      "\n❌ PROBE FAILED — Fatal error before verification steps could run:"
    );
    console.error(message);

    console.log("\n--- MACHINE-READABLE RESULT ---");
    console.log(
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          templateId: process.env.CANVA_TEMPLATE_ID || "(not set)",
          steps: [],
          verdict: "NO-GO",
          error: message,
        },
        null,
        2
      )
    );

    process.exit(1);
  });
