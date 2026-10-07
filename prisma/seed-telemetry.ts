import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Deterministic pseudo-random generator so demo data is reproducible
let seedNum = 20261004;
function rand() {
  seedNum = (seedNum * 1103515245 + 12345) % 2147483648;
  return seedNum / 2147483648;
}
function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

const FAILURE_REASONS = [
  "No words of requested length in word list",
  "Word list is empty",
  "Grid size too small for word count",
  "Invalid activity configuration",
];

const PATHS = ["/", "/wordle", "/word-search", "/word-lists", "/activities", "/dashboard"];

async function main() {
  // Clear previous telemetry so re-seeding is repeatable
  await prisma.generationEvent.deleteMany();
  await prisma.pageView.deleteMany();

  const pageViews: Array<{ path: string; durationMs: number; createdAt: Date }> = [];
  const generations: Array<{
    activityType: string;
    success: boolean;
    failureReason: string | null;
    durationMs: number;
    createdAt: Date;
  }> = [];

  const now = new Date();
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const day = new Date(now);
    day.setDate(day.getDate() - daysAgo);

    const pvCount = randInt(8, 20);
    for (let i = 0; i < pvCount; i++) {
      const createdAt = new Date(day);
      createdAt.setHours(randInt(8, 21), randInt(0, 59), randInt(0, 59));
      if (createdAt > now) continue;
      pageViews.push({
        path: PATHS[randInt(0, PATHS.length - 1)],
        durationMs: randInt(5000, 320000),
        createdAt,
      });
    }

    const genCount = randInt(3, 15);
    for (let i = 0; i < genCount; i++) {
      const createdAt = new Date(day);
      createdAt.setHours(randInt(8, 21), randInt(0, 59), randInt(0, 59));
      if (createdAt > now) continue;
      const success = rand() > 0.14;
      generations.push({
        activityType: rand() > 0.5 ? "wordle" : "word-search",
        success,
        failureReason: success ? null : FAILURE_REASONS[randInt(0, FAILURE_REASONS.length - 1)],
        durationMs: randInt(120, 4800),
        createdAt,
      });
    }
  }

  await prisma.pageView.createMany({ data: pageViews });
  await prisma.generationEvent.createMany({ data: generations });

  console.log(
    `Seeded ${pageViews.length} page views and ${generations.length} generation events over 30 days`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
