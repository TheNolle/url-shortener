-- CreateTable
CREATE TABLE "LinkMetadata" (
    "id" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "image" TEXT,
    "logo" TEXT,
    "author" TEXT,
    "publisher" TEXT,
    "date" TIMESTAMP(3),
    "favicon" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkMetadata_urlId_key" ON "LinkMetadata"("urlId");

-- CreateIndex
CREATE INDEX "LinkMetadata_urlId_idx" ON "LinkMetadata"("urlId");

-- AddForeignKey
ALTER TABLE "LinkMetadata" ADD CONSTRAINT "LinkMetadata_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Url"("id") ON DELETE CASCADE ON UPDATE CASCADE;
