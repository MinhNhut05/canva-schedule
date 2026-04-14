import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        ok: true,
        environment: process.env.APP_ENV ?? "unknown",
        version: process.env.APP_VERSION ?? "unknown",
        database: "up",
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        environment: process.env.APP_ENV ?? "unknown",
        version: process.env.APP_VERSION ?? "unknown",
        database: "down",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown health check error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
