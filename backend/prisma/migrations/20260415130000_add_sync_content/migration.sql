-- CreateEnum
CREATE TYPE "SyncSourceKind" AS ENUM ('WEBSITE');

-- CreateEnum
CREATE TYPE "SyncedContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DELETED');

-- CreateTable
CREATE TABLE "sync_sources" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" "SyncSourceKind" NOT NULL,
    "clubId" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "syncToken" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cursorSince" TEXT,
    "cursorId" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sync_sources_key_key" ON "sync_sources"("key");

-- CreateIndex
CREATE INDEX "sync_sources_clubId_idx" ON "sync_sources"("clubId");

-- AddForeignKey
ALTER TABLE "sync_sources" ADD CONSTRAINT "sync_sources_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "synced_articles" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "clubId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "author" TEXT,
    "role" TEXT,
    "description" TEXT,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" "SyncedContentStatus" NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "externalCreatedAt" TIMESTAMP(3) NOT NULL,
    "externalUpdatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "synced_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "synced_articles_sourceId_externalId_key" ON "synced_articles"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "synced_articles_clubId_status_publishedAt_idx" ON "synced_articles"("clubId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "synced_articles_externalUpdatedAt_idx" ON "synced_articles"("externalUpdatedAt");

-- AddForeignKey
ALTER TABLE "synced_articles" ADD CONSTRAINT "synced_articles_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sync_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synced_articles" ADD CONSTRAINT "synced_articles_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "synced_club_events" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "registrationUrl" TEXT,
    "status" "SyncedContentStatus" NOT NULL,
    "externalCreatedAt" TIMESTAMP(3) NOT NULL,
    "externalUpdatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "synced_club_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "synced_club_events_sourceId_externalId_key" ON "synced_club_events"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "synced_club_events_clubId_status_date_idx" ON "synced_club_events"("clubId", "status", "date");

-- CreateIndex
CREATE INDEX "synced_club_events_externalUpdatedAt_idx" ON "synced_club_events"("externalUpdatedAt");

-- AddForeignKey
ALTER TABLE "synced_club_events" ADD CONSTRAINT "synced_club_events_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sync_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synced_club_events" ADD CONSTRAINT "synced_club_events_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
