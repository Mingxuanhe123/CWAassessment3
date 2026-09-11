-- CreateTable
CREATE TABLE "WordList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "phonemes" TEXT NOT NULL,
    "wordLength" INTEGER NOT NULL,
    "wordListId" TEXT NOT NULL,
    CONSTRAINT "Word_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "WordList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "wordLength" INTEGER NOT NULL,
    "maxGuesses" INTEGER NOT NULL DEFAULT 6,
    "showHints" BOOLEAN NOT NULL DEFAULT true,
    "gridSize" INTEGER NOT NULL DEFAULT 10,
    "wordCount" INTEGER NOT NULL DEFAULT 5,
    "wordListId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Activity_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "WordList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WordList_name_key" ON "WordList"("name");

-- CreateIndex
CREATE INDEX "Word_wordListId_idx" ON "Word"("wordListId");

-- CreateIndex
CREATE INDEX "Word_wordLength_idx" ON "Word"("wordLength");

-- CreateIndex
CREATE UNIQUE INDEX "Word_word_wordListId_key" ON "Word"("word", "wordListId");

-- CreateIndex
CREATE INDEX "Activity_wordListId_idx" ON "Activity"("wordListId");

-- CreateIndex
CREATE INDEX "Activity_activityType_idx" ON "Activity"("activityType");
