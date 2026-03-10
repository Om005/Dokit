-- CreateEnum
CREATE TYPE "ShareAccess" AS ENUM ('INVITE_ONLY', 'ANYONE_WITH_LINK');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "shareAccess" "ShareAccess" NOT NULL DEFAULT 'INVITE_ONLY';
