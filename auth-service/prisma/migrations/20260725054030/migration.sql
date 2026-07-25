/*
  Warnings:

  - The primary key for the `role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `role` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `role_id` on the `account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_role_id_fkey";

-- AlterTable
ALTER TABLE "account" DROP COLUMN "role_id",
ADD COLUMN     "role_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "role" DROP CONSTRAINT "role_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "role_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "account_role_id_idx" ON "account"("role_id");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
