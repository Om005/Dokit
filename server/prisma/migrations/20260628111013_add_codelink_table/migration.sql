-- CreateEnum
CREATE TYPE "CodeLinkVisibility" AS ENUM ('ANYONE_WITH_LINK', 'RESTRICTED');

-- CreateTable
CREATE TABLE "CodeLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL,
    "compressedCode" BYTEA NOT NULL,
    "isPasswordProtected" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "CodeLinkVisibility" NOT NULL DEFAULT 'ANYONE_WITH_LINK',
    "passwordHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeLinkAccess" (
    "id" TEXT NOT NULL,
    "codeLinkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeLinkAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeLink_id_key" ON "CodeLink"("id");

-- CreateIndex
CREATE INDEX "CodeLink_userId_idx" ON "CodeLink"("userId");

-- CreateIndex
CREATE INDEX "CodeLink_id_idx" ON "CodeLink"("id");

-- CreateIndex
CREATE INDEX "CodeLinkAccess_codeLinkId_idx" ON "CodeLinkAccess"("codeLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeLinkAccess_codeLinkId_userId_key" ON "CodeLinkAccess"("codeLinkId", "userId");

-- AddForeignKey
ALTER TABLE "CodeLink" ADD CONSTRAINT "CodeLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeLinkAccess" ADD CONSTRAINT "CodeLinkAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeLinkAccess" ADD CONSTRAINT "CodeLinkAccess_codeLinkId_fkey" FOREIGN KEY ("codeLinkId") REFERENCES "CodeLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
