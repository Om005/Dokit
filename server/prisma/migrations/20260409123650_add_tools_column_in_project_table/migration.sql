-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "tools" TEXT[] DEFAULT ARRAY[]::TEXT[];
