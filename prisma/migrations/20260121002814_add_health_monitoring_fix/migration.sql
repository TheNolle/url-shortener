/*
  Warnings:

  - The values [UNHEALTHY] on the enum `HealthStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "HealthStatus_new" AS ENUM ('HEALTHY', 'WARNING', 'BROKEN', 'UNKNOWN');
ALTER TABLE "public"."Url" ALTER COLUMN "healthStatus" DROP DEFAULT;
ALTER TABLE "Url" ALTER COLUMN "healthStatus" TYPE "HealthStatus_new" USING ("healthStatus"::text::"HealthStatus_new");
ALTER TABLE "HealthCheck" ALTER COLUMN "status" TYPE "HealthStatus_new" USING ("status"::text::"HealthStatus_new");
ALTER TYPE "HealthStatus" RENAME TO "HealthStatus_old";
ALTER TYPE "HealthStatus_new" RENAME TO "HealthStatus";
DROP TYPE "public"."HealthStatus_old";
ALTER TABLE "Url" ALTER COLUMN "healthStatus" SET DEFAULT 'UNKNOWN';
COMMIT;
