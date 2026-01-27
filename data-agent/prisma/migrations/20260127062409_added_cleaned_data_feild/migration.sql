-- CreateTable
CREATE TABLE "CleanedData" (
    "id" TEXT NOT NULL,
    "dataId" TEXT NOT NULL,
    "cleanedContent" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "userId" TEXT,
    "channelId" TEXT,
    "urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "codeBlocks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasMedia" BOOLEAN NOT NULL DEFAULT false,
    "filename" TEXT,
    "fileType" TEXT,
    "extension" TEXT,
    "isCode" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT,
    "sections" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "CleanedData_id_key" ON "CleanedData"("id");

-- AddForeignKey
ALTER TABLE "CleanedData" ADD CONSTRAINT "CleanedData_dataId_fkey" FOREIGN KEY ("dataId") REFERENCES "Data"("id") ON DELETE CASCADE ON UPDATE CASCADE;
