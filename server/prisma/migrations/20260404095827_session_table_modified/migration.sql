/*
  Warnings:

  - Made the column `userAgent` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `region` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `refreshTokenHash` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `device` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `browser` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `os` on table `Session` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "userAgent" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "region" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "refreshTokenHash" SET NOT NULL,
ALTER COLUMN "device" SET NOT NULL,
ALTER COLUMN "browser" SET NOT NULL,
ALTER COLUMN "os" SET NOT NULL;
