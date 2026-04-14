/*
  Warnings:

  - The values [GITHUB] on the enum `ProjectStack` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjectStack_new" AS ENUM ('NODE', 'REACT_VITE', 'EXPRESS', 'BLANK');
ALTER TABLE "Project" ALTER COLUMN "stack" TYPE "ProjectStack_new" USING ("stack"::text::"ProjectStack_new");
ALTER TYPE "ProjectStack" RENAME TO "ProjectStack_old";
ALTER TYPE "ProjectStack_new" RENAME TO "ProjectStack";
DROP TYPE "public"."ProjectStack_old";
COMMIT;
