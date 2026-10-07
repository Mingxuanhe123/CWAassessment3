import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/health - healthcheck endpoint (returns 200 OK when healthy)
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const [wordLists, activities, generations] = await Promise.all([
      prisma.wordList.count(),
      prisma.activity.count(),
      prisma.generationEvent.count(),
    ]);
    return NextResponse.json(
      {
        status: "OK",
        database: "connected",
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
        counts: { wordLists, activities, generations },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "DOWN",
        database: "disconnected",
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
