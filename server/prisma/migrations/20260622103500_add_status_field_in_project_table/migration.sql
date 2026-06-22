-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('INITIALIZING', 'RUNNING', 'STOPPED', 'FAILED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'STOPPED';
