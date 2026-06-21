import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

import { CanvaBotBlockedError, shareCanvaDesignViaPublicLink } from "../src/lib/canva/share-bot";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const LOCK_MS = 5 * 60_000;
// Canva's editor UI is flaky under headed Xvfb; retry a transient share failure
// a few times (with a short backoff) before giving up and marking it FAILED.
const MAX_SHARE_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 30_000;
const POLL_MS = Number.parseInt(process.env.CANVA_SHARE_WORKER_POLL_MS ?? "5000", 10);
const DRY_RUN = process.env.CANVA_SHARE_DRY_RUN !== "false";
// Real sharing connects to a persistent Chrome via CDP using a logged-in profile dir.
const CHROME_PROFILE_DIR = process.env.CANVA_BOT_CHROME_PROFILE_DIR;
const RELOGIN_HINT =
  "Re-login bot: ssh -X canva@<vps> rồi chạy `pnpm canva:bot-login` (xem deploy/worker/README.md).";

function validateWorkerConfig() {
  if (!DRY_RUN && !CHROME_PROFILE_DIR) {
    throw new Error(
      "CANVA_BOT_CHROME_PROFILE_DIR is required when CANVA_SHARE_DRY_RUN=false " +
        "(thư mục profile Chrome đã đăng nhập Canva).",
    );
  }
}

async function claimJob() {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + LOCK_MS);

  const job = await prisma.canvaShareJob.findFirst({
    where: {
      OR: [
        { status: "PENDING", OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
        { status: "RUNNING", lockedUntil: { lt: now } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return null;

  const claimed = await prisma.canvaShareJob.updateMany({
    where: {
      id: job.id,
      OR: [
        { status: "PENDING", OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
        { status: "RUNNING", lockedUntil: { lt: now } },
      ],
    },
    data: {
      status: "RUNNING",
      lockedUntil,
      startedAt: now,
      attemptCount: { increment: 1 },
      lastError: null,
    },
  });

  if (claimed.count === 0) return null;

  return prisma.canvaShareJob.findUnique({ where: { id: job.id } });
}

async function finishJob(
  job: NonNullable<Awaited<ReturnType<typeof claimJob>>>,
  data: {
    status: "SUCCEEDED" | "FAILED" | "DRY_RUN";
    lastError?: string | null;
    editUrl?: string | null;
  },
) {
  const result = await prisma.canvaShareJob.updateMany({
    where: {
      id: job.id,
      status: "RUNNING",
      lockedUntil: job.lockedUntil,
    },
    data: {
      status: data.status,
      lockedUntil: null,
      finishedAt: new Date(),
      lastError: data.lastError ?? null,
      // On success, store the canonical public edit URL so the app can show a link
      // that other accounts can actually open (not the private Connect-API URL).
      ...(data.editUrl ? { editUrl: data.editUrl } : {}),
    },
  });

  if (result.count === 0) {
    console.warn("[canva-share-worker] skipped stale finish", {
      jobId: job.id,
      designId: job.designId,
      status: data.status,
    });
  }
}

// Release a transiently-failed job back to PENDING with a short backoff so the
// loop retries it later, instead of marking it FAILED on the first hiccup.
async function requeueJob(
  job: NonNullable<Awaited<ReturnType<typeof claimJob>>>,
  lastError: string,
) {
  await prisma.canvaShareJob.updateMany({
    where: {
      id: job.id,
      status: "RUNNING",
      lockedUntil: job.lockedUntil,
    },
    data: {
      status: "PENDING",
      lockedUntil: new Date(Date.now() + RETRY_BACKOFF_MS),
      lastError,
    },
  });
}

async function processJob(job: Awaited<ReturnType<typeof claimJob>>) {
  if (!job) return;

  if (DRY_RUN) {
    await finishJob(job, {
      status: "DRY_RUN",
      lastError: "Dry-run mode: Canva share was not sent.",
    });
    console.log(`[canva-share-worker] dry-run: would set public-link edit for ${job.designId}`);
    return;
  }

  try {
    const publicEditUrl = await shareCanvaDesignViaPublicLink({
      editUrl: job.editUrl ?? "",
    });

    await finishJob(job, { status: "SUCCEEDED", editUrl: publicEditUrl ?? undefined });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Canva UI sharing bot failed.";
    console.error("[canva-share-worker] share failed", {
      jobId: job.id,
      designId: job.designId,
      attempt: job.attemptCount,
      message,
    });

    // A Cloudflare block won't clear by retrying — fail fast so an operator
    // re-logs-in the bot (refreshes cf_clearance) instead of burning attempts.
    if (error instanceof CanvaBotBlockedError) {
      // Cloudflare blocked — tell the operator explicitly what to do.
      const hint = `${message}\n${RELOGIN_HINT}`;
      await finishJob(job, { status: "FAILED", lastError: hint });
      console.error(`[canva-share-worker] ⚠️ ${hint}`);
      return;
    }

    if (job.attemptCount < MAX_SHARE_ATTEMPTS) {
      await requeueJob(job, message);
      console.warn(
        `[canva-share-worker] retry scheduled for ${job.designId} (attempt ${job.attemptCount}/${MAX_SHARE_ATTEMPTS})`,
      );
    } else {
      await finishJob(job, {
        status: "FAILED",
        lastError: "Không thể chia sẻ Canva tự động. Vui lòng chia sẻ thủ công trong Canva.",
      });
    }
  }
}

async function loop() {
  validateWorkerConfig();
  console.log(
    `[canva-share-worker] starting; dryRun=${DRY_RUN}` +
      (DRY_RUN ? "" : `; chromeProfile=${CHROME_PROFILE_DIR}`),
  );

  while (true) {
    try {
      const job = await claimJob();
      if (job) {
        await processJob(job);
      } else {
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      }
    } catch (error) {
      console.error("[canva-share-worker] failed", error);
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
  }
}

loop()
  .catch((error) => {
    console.error("[canva-share-worker] fatal", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
