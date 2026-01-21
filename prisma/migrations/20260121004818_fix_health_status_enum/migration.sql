/*
  Warnings:

  - The `rotationType` column on the `Url` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Url" DROP COLUMN "rotationType",
ADD COLUMN     "rotationType" TEXT;

-- DropEnum
DROP TYPE "RotationType";
