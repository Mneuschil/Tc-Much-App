-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "public"."ChallengeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterEnum
DO $$ BEGIN
  ALTER TYPE "public"."AvailabilityStatus" ADD VALUE 'MAYBE';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- DropIndex
DROP INDEX IF EXISTS "public"."rankings_clubId_rank_key";

-- DropIndex
DROP INDEX IF EXISTS "public"."rankings_clubId_userId_key";

-- AlterTable
ALTER TABLE "public"."channels" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."clubs" ADD COLUMN IF NOT EXISTS "nuligaClubId" TEXT;

-- AlterTable
ALTER TABLE "public"."rankings" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'HERREN';

-- AlterTable
ALTER TABLE "public"."tournament_matches" ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."tournaments" ADD COLUMN IF NOT EXISTS "roundDeadlineDays" INTEGER NOT NULL DEFAULT 14;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."ranking_challenges" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'HERREN',
    "challengerId" TEXT NOT NULL,
    "challengedId" TEXT NOT NULL,
    "status" "public"."ChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ranking_challenges_clubId_idx" ON "public"."ranking_challenges"("clubId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "channel_members_userId_idx" ON "public"."channel_members"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "match_results_submittedById_idx" ON "public"."match_results"("submittedById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "match_results_winnerId_idx" ON "public"."match_results"("winnerId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "rankings_clubId_userId_category_key" ON "public"."rankings"("clubId", "userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "rankings_clubId_rank_category_key" ON "public"."rankings"("clubId", "rank", "category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "team_members_userId_idx" ON "public"."team_members"("userId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "public"."ranking_challenges" ADD CONSTRAINT "ranking_challenges_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "public"."ranking_challenges" ADD CONSTRAINT "ranking_challenges_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "public"."ranking_challenges" ADD CONSTRAINT "ranking_challenges_challengedId_fkey" FOREIGN KEY ("challengedId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
