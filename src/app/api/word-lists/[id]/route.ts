import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/word-lists/[id] - Get a single word list with its words
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wordList = await prisma.wordList.findUnique({
      where: { id },
      include: {
        words: { orderBy: { word: "asc" } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!wordList) {
      return NextResponse.json({ error: "Word list not found" }, { status: 404 });
    }

    return NextResponse.json(wordList);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch word list", details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/word-lists/[id] - Update a word list
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const existing = await prisma.wordList.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Word list not found" }, { status: 404 });
    }

    if (name && typeof name === "string" && name.trim().length > 0) {
      const duplicate = await prisma.wordList.findFirst({
        where: { name: name.trim(), id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Conflict", details: `Word list "${name}" already exists` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.wordList.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
      include: { _count: { select: { words: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update word list", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/word-lists/[id] - Delete a word list (cascades to words & activities)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.wordList.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Word list not found" }, { status: 404 });
    }

    await prisma.wordList.delete({ where: { id } });
    return NextResponse.json({ message: "Word list deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete word list", details: String(error) },
      { status: 500 }
    );
  }
}
