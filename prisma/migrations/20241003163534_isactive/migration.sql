/*
  Warnings:

  - You are about to drop the column `isAtive` on the `SenderEmail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SenderEmail" DROP COLUMN "isAtive",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;
