import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/telemetry - record page views and generation events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, path, durationMs, activityType, success, failureReason } = body;

    if (type === "pageview") {
      await prisma.pageView.create({
        data: {
          path: typeof path === "string" && path.startsWith("/") ? path : "/",
          durationMs: Math.max(0, Math.round(Number(durationMs) || 0)),
        },
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    if (type === "generation") {
      await prisma.generationEvent.create({
        data: {
          activityType: activityType === "word-search" ? "word-search" : "wordle",
          success: Boolean(success),
          failureReason: success ? null : String(failureReason || "Unknown error"),
          durationMs: Math.max(0, Math.round(Number(durationMs) || 0)),
        },
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Validation failed", details: "type must be pageview or generation" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal error", details: "Failed to record telemetry" },
      { status: 500 }
    );
  }
}
