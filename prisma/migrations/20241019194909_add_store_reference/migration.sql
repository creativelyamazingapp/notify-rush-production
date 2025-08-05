-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";

-- AlterTable
ALTER TABLE "EmailTemplate" ADD COLUMN     "storeId" TEXT NOT NULL DEFAULT 'new';

-- CreateIndex
CREATE INDEX "EmailTemplate_storeId_idx" ON "EmailTemplate"("storeId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
