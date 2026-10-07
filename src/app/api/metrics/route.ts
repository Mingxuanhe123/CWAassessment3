import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/metrics - aggregated dashboard metrics
export async function GET() {
  try {
    const [totalWordLists, totalWords, emptyWordLists, activityGroups, genGroups, pageAgg, since] =
      await Promise.all([
        prisma.wordList.count(),
        prisma.word.count(),
        prisma.wordList.count({ where: { words: { none: {} } } }),
        prisma.activity.groupBy({ by: ["activityType"], _count: { _all: true } }),
        prisma.generationEvent.groupBy({
          by: ["activityType", "success"],
          _count: { _all: true },
        }),
        prisma.pageView.aggregate({ _avg: { durationMs: true }, _count: { _all: true } }),
        Promise.resolve((() => {
          const d = new Date();
          d.setDate(d.getDate() - 13);
          d.setHours(0, 0, 0, 0);
          return d;
        })()),
      ]);

    // Activities by type
    let wordleActivities = 0;
    let wordSearchActivities = 0;
    for (const g of activityGroups) {
      if (g.activityType === "wordle") wordleActivities = g._count._all;
      else if (g.activityType === "word-search") wordSearchActivities = g._count._all;
    }

    // Generation success / failure counts
    let successCount = 0;
    let failedCount = 0;
    for (const g of genGroups) {
      if (g.success) successCount += g._count._all;
      else failedCount += g._count._all;
    }
    const totalGenerations = successCount + failedCount;
    const failureRate = totalGenerations > 0 ? failedCount / totalGenerations : 0;
    const mostUsedActivityType =
      wordleActivities >= wordSearchActivities ? "wordle" : "word-search";

    // Daily generation series (last 14 days)
    const recentEvents = await prisma.generationEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, success: true },
      orderBy: { createdAt: "asc" },
    });
    const dayMap = new Map<string, { date: string; success: number; failed: number }>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { date: key, success: 0, failed: 0 });
    }
    for (const e of recentEvents) {
      const key = e.createdAt.toISOString().slice(0, 10);
      const row = dayMap.get(key);
      if (row) {
        if (e.success) row.success += 1;
        else row.failed += 1;
      }
    }
    const dailySeries = Array.from(dayMap.values());

    // Recent generation log (for reporting view)
    const recentLog = await prisma.generationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Alerts
    const alerts: Array<{ level: "error" | "warning" | "info"; message: string }> = [];
    if (failureRate > 0.1) {
      alerts.push({
        level: "error",
        message: `Generation failure rate is ${(failureRate * 100).toFixed(1)}% (threshold 10%)`,
      });
    }
    if (emptyWordLists > 0) {
      alerts.push({
        level: "warning",
        message: `${emptyWordLists} word list(s) contain no words - generation will fail`,
      });
    }
    if (failedCount > 0) {
      alerts.push({
        level: "warning",
        message: `${failedCount} failed generation attempt(s) recorded in total`,
      });
    }
    if (totalGenerations === 0) {
      alerts.push({ level: "info", message: "No generation events recorded yet" });
    }
    if (alerts.length === 0) {
      alerts.push({ level: "info", message: "All systems normal - no issues detected" });
    }

    return NextResponse.json({
      overview: {
        totalWordLists,
        totalWords,
        totalActivities: wordleActivities + wordSearchActivities,
        wordleActivities,
        wordSearchActivities,
        mostUsedActivityType,
        totalPageViews: pageAgg._count._all,
        averageTimeOnPageMs: Math.round(pageAgg._avg.durationMs ?? 0),
      },
      generations: {
        total: totalGenerations,
        success: successCount,
        failed: failedCount,
        failureRate,
      },
      dailySeries,
      recentLog,
      alerts,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal error", details: "Failed to compute metrics" },
      { status: 500 }
    );
  }
}
