-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL,
    "cleanedDataId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "source" "Source" NOT NULL,
    "chunkType" TEXT NOT NULL,
    "contextMetadata" TEXT NOT NULL,
    "messageCount" INTEGER,
    "participants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "functionName" TEXT,
    "headerPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Chunk_id_key" ON "Chunk"("id");

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_cleanedDataId_fkey" FOREIGN KEY ("cleanedDataId") REFERENCES "CleanedData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
