-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "signInEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "ShareAccess";
