-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "bypassRateLimit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bypassSecurity" BOOLEAN NOT NULL DEFAULT false;
