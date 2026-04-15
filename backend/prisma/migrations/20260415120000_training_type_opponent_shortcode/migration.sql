-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "public"."TrainingType" AS ENUM ('MANNSCHAFTSTRAINING', 'JUGENDTRAINING', 'SCHNUPPERSTUNDE', 'PRIVATGRUPPE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN IF NOT EXISTS "trainingType" "public"."TrainingType";
ALTER TABLE "public"."events" ADD COLUMN IF NOT EXISTS "opponentName" TEXT;

-- AlterTable
ALTER TABLE "public"."teams" ADD COLUMN IF NOT EXISTS "shortCode" TEXT;
