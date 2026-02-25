-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isPasswordProtected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT;
