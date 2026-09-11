import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/word-lists - List all word lists with word counts
export async function GET() {
  try {
    const wordLists = await prisma.wordList.findMany({
      include: {
        _count: { select: { words: true, activities: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(wordLists);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch word lists", details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/word-lists - Create a new word list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation failed", details: "Name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const existing = await prisma.wordList.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json(
        { error: "Conflict", details: `Word list "${name}" already exists` },
        { status: 409 }
      );
    }

    const wordList = await prisma.wordList.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
      include: { _count: { select: { words: true } } },
    });

    return NextResponse.json(wordList, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create word list", details: String(error) },
      { status: 500 }
    );
  }
}
