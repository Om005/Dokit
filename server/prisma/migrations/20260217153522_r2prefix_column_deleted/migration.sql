/*
  Warnings:

  - You are about to drop the column `r2Prefix` on the `Project` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Project_r2Prefix_key";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "r2Prefix";
