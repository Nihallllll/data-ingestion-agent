-- CreateEnum
CREATE TYPE "Source" AS ENUM ('Discord', 'Github');

-- CreateTable
CREATE TABLE "Data" (
    "id" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "data" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Data_id_key" ON "Data"("id");
