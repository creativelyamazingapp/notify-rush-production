-- CreateTable
CREATE TABLE "SenderEmail" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "shop" TEXT NOT NULL,

    CONSTRAINT "SenderEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SenderEmail_email_key" ON "SenderEmail"("email");
