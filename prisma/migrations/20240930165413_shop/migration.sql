/*
  Warnings:

  - Added the required column `shop` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shop" TEXT NOT NULL;
