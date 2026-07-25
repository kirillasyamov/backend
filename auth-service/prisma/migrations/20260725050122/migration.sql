/*
  Warnings:

  - A unique constraint covering the columns `[login]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `login` to the `account` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `account` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "account" ADD COLUMN     "login" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "account_login_key" ON "account"("login");
