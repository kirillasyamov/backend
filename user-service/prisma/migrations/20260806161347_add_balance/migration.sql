-- AlterTable
ALTER TABLE "user" ADD COLUMN     "balance" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "transfer" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_idempotencyKey_key" ON "transfer"("idempotencyKey");

-- CreateIndex
CREATE INDEX "transfer_fromUserId_idx" ON "transfer"("fromUserId");

-- CreateIndex
CREATE INDEX "transfer_toUserId_idx" ON "transfer"("toUserId");

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
