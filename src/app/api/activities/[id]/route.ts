import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/activities/[id] - Get single activity with filtered word‑list words
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const filtered = await prisma.activity.findUnique({
      where: { id },
      include: {
        wordList: {
          include: {
            words: {
              where: { wordLength: activity.wordLength },
              orderBy: { word: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch activity", details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/activities/[id] - Update an activity with full validation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      activityType,
      wordLength,
      maxGuesses,
      showHints,
      gridSize,
      wordCount,
      wordListId
    } = body;

    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // Validation rules same as POST create
    if (name !== undefined && (!name || typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Validation failed", details: "Name is required" },
        { status: 400 }
      );
    }
    if (activityType !== undefined && !["wordle", "word-search"].includes(activityType)) {
      return NextResponse.json(
        { error: "Validation failed", details: "activityType must be 'wordle' or 'word-search'" },
        { status: 400 }
      );
    }
    if (wordLength !== undefined && ![3, 4, 5].includes(wordLength)) {
      return NextResponse.json(
        { error: "Validation failed", details: "wordLength must be 3, 4, or 5" },
        { status: 400 }
      );
    }
    if (wordListId !== undefined) {
      const wordList = await prisma.wordList.findUnique({ where: { id: wordListId } });
      if (!wordList) {
        return NextResponse.json(
          { error: "Not found", details: "Word list not found" },
          { status: 404 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (activityType !== undefined) updateData.activityType = activityType;
    if (wordLength !== undefined) updateData.wordLength = wordLength;
    if (maxGuesses !== undefined) updateData.maxGuesses = maxGuesses;
    if (showHints !== undefined) updateData.showHints = showHints;
    if (gridSize !== undefined) updateData.gridSize = gridSize;
    if (wordCount !== undefined) updateData.wordCount = wordCount;
    if (wordListId !== undefined) updateData.wordListId = wordListId;

    const updated = await prisma.activity.update({
      where: { id },
      data: updateData,
      include: {
        wordList: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update activity", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/activities/[id] - Delete an activity
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    await prisma.activity.delete({ where: { id } });
    return NextResponse.json({ message: "Activity deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete activity", details: String(error) },
      { status: 500 }
    );
  }
}
