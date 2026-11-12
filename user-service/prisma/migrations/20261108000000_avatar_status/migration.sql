-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AvatarStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AlterTable: add status column (default PENDING)
ALTER TABLE "avatar" ADD COLUMN IF NOT EXISTS "status" "AvatarStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill existing rows from the legacy isActive flag, then drop it
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar' AND column_name = 'isActive') THEN
        UPDATE "avatar" SET "status" = 'ACTIVE' WHERE "isActive" = true;
        ALTER TABLE "avatar" DROP COLUMN "isActive";
    END IF;
END $$;

-- SwapIndex: userId+isActive -> userId+status
DROP INDEX IF EXISTS "avatar_userId_isActive_idx";

CREATE INDEX IF NOT EXISTS "avatar_userId_status_idx" ON "avatar"("userId", "status");
