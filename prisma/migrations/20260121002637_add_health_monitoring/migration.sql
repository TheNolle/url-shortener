-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'UNHEALTHY', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Url" ADD COLUMN     "healthCheckError" TEXT,
ADD COLUMN     "healthStatus" "HealthStatus" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "lastHealthCheck" TIMESTAMP(3),
ADD COLUMN     "lastStatusCode" INTEGER;

-- CreateTable
CREATE TABLE "HealthCheck" (
    "id" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusCode" INTEGER,
    "responseTime" INTEGER,
    "status" "HealthStatus" NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealthCheck_urlId_idx" ON "HealthCheck"("urlId");

-- CreateIndex
CREATE INDEX "HealthCheck_checkedAt_idx" ON "HealthCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "Url_healthStatus_idx" ON "Url"("healthStatus");

-- AddForeignKey
ALTER TABLE "HealthCheck" ADD CONSTRAINT "HealthCheck_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Url"("id") ON DELETE CASCADE ON UPDATE CASCADE;
