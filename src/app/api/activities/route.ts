import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/activities - List all activities
export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        wordList: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch activities", details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create a new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, activityType, wordLength, maxGuesses, showHints, gridSize, wordCount, wordListId } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation failed", details: "Name is required" },
        { status: 400 }
      );
    }
    if (!activityType || !["wordle", "word-search"].includes(activityType)) {
      return NextResponse.json(
        { error: "Validation failed", details: "activityType must be 'wordle' or 'word-search'" },
        { status: 400 }
      );
    }
    if (!wordLength || ![3, 4, 5].includes(wordLength)) {
      return NextResponse.json(
        { error: "Validation failed", details: "wordLength must be 3, 4, or 5" },
        { status: 400 }
      );
    }
    if (!wordListId) {
      return NextResponse.json(
        { error: "Validation failed", details: "wordListId is required" },
        { status: 400 }
      );
    }

    // Verify word list exists
    const wordList = await prisma.wordList.findUnique({ where: { id: wordListId } });
    if (!wordList) {
      return NextResponse.json(
        { error: "Not found", details: "Word list not found" },
        { status: 404 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        name: name.trim(),
        activityType,
        wordLength,
        maxGuesses: activityType === "wordle" ? (maxGuesses || 6) : 6,
        showHints: activityType === "wordle" ? (showHints ?? true) : true,
        gridSize: activityType === "word-search" ? (gridSize || 10) : 10,
        wordCount: activityType === "word-search" ? (wordCount || 5) : 5,
        wordListId,
      },
      include: {
        wordList: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create activity", details: String(error) },
      { status: 500 }
    );
  }
}
