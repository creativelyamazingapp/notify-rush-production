-- CreateTable
CREATE TABLE "EmailLog" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "bodyText" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentCount" INTEGER NOT NULL DEFAULT 1,
    "isOpened" BOOLEAN NOT NULL DEFAULT false,
    "isBouncedBack" BOOLEAN NOT NULL DEFAULT false,
    "deliveryStatus" TEXT,
    "customerName" TEXT,
    "shop" TEXT NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);
