/*
  Warnings:

  - You are about to drop the column `expires` on the `Session` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "expires",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "onlineAccessInfo" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "isOnline" DROP DEFAULT,
ALTER COLUMN "accessToken" DROP NOT NULL,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "accountOwner" DROP NOT NULL,
ALTER COLUMN "accountOwner" DROP DEFAULT,
ALTER COLUMN "collaborator" DROP DEFAULT,
ALTER COLUMN "emailVerified" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "customerId" TEXT,
    "customerFirstName" TEXT,
    "customerLastName" TEXT,
    "shippingFirstName" TEXT,
    "shippingLastName" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "zip" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLineItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "OrderLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "images" TEXT[],
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderLineItem_orderId_idx" ON "OrderLineItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
