-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundLineItem" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderName" TEXT NOT NULL DEFAULT '001',

    CONSTRAINT "RefundLineItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundLineItem" ADD CONSTRAINT "RefundLineItem_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
