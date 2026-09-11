import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/word-lists/[id]/words - Add a word to a word list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { word, phonemes } = body;

    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation failed", details: "Word is required" },
        { status: 400 }
      );
    }
    if (!phonemes || !Array.isArray(phonemes) || phonemes.length === 0) {
      return NextResponse.json(
        { error: "Validation failed", details: "Phonemes must be a non-empty array" },
        { status: 400 }
      );
    }

    const wordList = await prisma.wordList.findUnique({ where: { id } });
    if (!wordList) {
      return NextResponse.json({ error: "Word list not found" }, { status: 404 });
    }

    const existing = await prisma.word.findUnique({
      where: { word_wordListId: { word: word.trim(), wordListId: id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Conflict", details: `Word "${word}" already exists in this list` },
        { status: 409 }
      );
    }

    const created = await prisma.word.create({
      data: {
        word: word.trim(),
        phonemes: JSON.stringify(phonemes),
        wordLength: phonemes.length,
        wordListId: id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add word", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/word-lists/[id]/words?wordId=xxx - Remove a word
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wordId = request.nextUrl.searchParams.get("wordId");

    if (!wordId) {
      return NextResponse.json(
        { error: "Validation failed", details: "wordId query parameter is required" },
        { status: 400 }
      );
    }

    const word = await prisma.word.findFirst({
      where: { id: wordId, wordListId: id },
    });
    if (!word) {
      return NextResponse.json({ error: "Word not found in this list" }, { status: 404 });
    }

    await prisma.word.delete({ where: { id: wordId } });
    return NextResponse.json({ message: "Word deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete word", details: String(error) },
      { status: 500 }
    );
  }
}
// PUT /api/word-lists/[id]/words?wordId=xxx - Update an existing word
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) 
{
  try {
    const { id } = await params;
    const wordId = request.nextUrl.searchParams.get("wordId");
    const body = await request.json();
    const { word, phonemes } = body;

    if (!wordId) {
      return NextResponse.json(
        { error: "Validation failed", details: "wordId query parameter is required" },
        { status: 400 }
      );
    }
    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation failed", details: "Word is required" },
        { status: 400 }
      );
    }
    if (!phonemes || !Array.isArray(phonemes) || phonemes.length === 0) {
      return NextResponse.json(
        { error: "Validation failed", details: "Phonemes must be a non-empty array" },
        { status: 400 }
      );
    }

    // 校验单词属于当前词表
    const targetWord = await prisma.word.findFirst({
      where: { id: wordId, wordListId: id },
    });
    if (!targetWord) {
      return NextResponse.json({ error: "Word not found in this list" }, { status: 404 });
    }
    // 检查同词表重名，排除当前正在编辑的单词自身
    const duplicate = await prisma.word.findUnique({
      where: {
        word_wordListId: { word: word.trim(), wordListId: id },
      },
    });
    if (duplicate && duplicate.id !== wordId) {
      return NextResponse.json(
        { error: "Conflict", details: `Word "${word}" already exists in this list` },
        { status: 409 }
      );
    }
    const updatedWord = await prisma.word.update({
      where: { id: wordId },
      data: {
        word: word.trim(),
        phonemes: JSON.stringify(phonemes),
        wordLength: phonemes.length,
      },
    });
    return NextResponse.json(updatedWord);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update word", details: String(error) },
      { status: 500 }
    );
  }
}
