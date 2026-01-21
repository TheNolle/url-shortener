-- AlterTable
ALTER TABLE "Url" ADD COLUMN     "isPasswordProtected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT;
