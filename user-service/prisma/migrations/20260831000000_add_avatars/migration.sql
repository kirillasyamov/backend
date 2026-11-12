-- CreateTable
CREATE TABLE "avatar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "avatar_userId_isActive_idx" ON "avatar"("userId", "isActive");

-- CreateIndex
CREATE INDEX "avatar_userId_createdAt_idx" ON "avatar"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "avatar" ADD CONSTRAINT "avatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
