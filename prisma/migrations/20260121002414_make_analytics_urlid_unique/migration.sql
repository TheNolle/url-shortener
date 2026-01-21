/*
  Warnings:

  - A unique constraint covering the columns `[urlId]` on the table `Analytics` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RotationType" AS ENUM ('RANDOM', 'WEIGHTED', 'SEQUENTIAL');

-- AlterTable
ALTER TABLE "ClickEvent" ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- AlterTable
ALTER TABLE "Url" ADD COLUMN     "currentRotation" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isRotation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rotationType" "RotationType";

-- CreateTable
CREATE TABLE "RotationLink" (
    "id" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RotationLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RotationLink_urlId_idx" ON "RotationLink"("urlId");

-- CreateIndex
CREATE UNIQUE INDEX "Analytics_urlId_key" ON "Analytics"("urlId");

-- AddForeignKey
ALTER TABLE "RotationLink" ADD CONSTRAINT "RotationLink_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Url"("id") ON DELETE CASCADE ON UPDATE CASCADE;
