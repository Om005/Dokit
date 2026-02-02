/*
  Warnings:

  - You are about to drop the column `deviceType` on the `Session` table. All the data in the column will be lost.
  - The `browser` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `os` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "deviceType",
ADD COLUMN     "device" JSONB,
DROP COLUMN "browser",
ADD COLUMN     "browser" JSONB,
DROP COLUMN "os",
ADD COLUMN     "os" JSONB;
